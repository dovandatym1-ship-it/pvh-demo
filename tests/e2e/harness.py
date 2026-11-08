#!/usr/bin/env python3
"""
PVH Automated E2E Test Harness & Assertion Engine.
Independent, requirement-driven, opaque-box testing framework.
"""

import hashlib
import json
import os
import re
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple, Union


@dataclass
class TestResult:
    test_id: str
    feature_id: int
    tier: int
    name: str
    status: str  # "PASS", "FAIL", "SKIP"
    message: str
    duration: float = 0.0
    details: Optional[Dict[str, Any]] = None


@dataclass
class TestCase:
    test_id: str
    tier: int
    feature_id: int
    name: str
    description: str
    source: str
    test_fn: Callable[["TestHarness"], None]
    tags: List[str] = field(default_factory=list)


class TestAssertionError(AssertionError):
    """Custom assertion error capturing requirement failures with clear diagnostics."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.details = details or {}


class TestHarness:
    """Core test harness providing execution context, file/git/ast helpers, and assertions."""

    def __init__(self, target_dir: Union[str, Path]):
        self.target_dir = Path(target_dir).resolve()
        self.baseline_dir = Path("/Users/dovandat/Work/projects/PVH/Working/demo-pvh").resolve()

    def resolve_path(self, rel_path: Union[str, Path]) -> Path:
        """Resolve a path relative to the target application directory."""
        return self.target_dir / rel_path

    def file_exists(self, rel_path: Union[str, Path]) -> bool:
        """Check whether a file or directory exists in target application."""
        return self.resolve_path(rel_path).exists()

    def read_text(self, rel_path: Union[str, Path]) -> str:
        """Read text content of a file relative to target application."""
        target_file = self.resolve_path(rel_path)
        if not target_file.is_file():
            raise FileNotFoundError(f"File not found: {target_file}")
        return target_file.read_text(encoding="utf-8", errors="replace")

    def read_json(self, rel_path: Union[str, Path]) -> Any:
        """Read and parse JSON from a file relative to target application."""
        content = self.read_text(rel_path)
        return json.loads(content)

    def run_cmd(
        self, cmd: List[str], cwd: Optional[Path] = None, timeout: int = 30
    ) -> Tuple[int, str, str]:
        """Execute a shell command within the target directory context."""
        work_dir = cwd or self.target_dir
        try:
            res = subprocess.run(
                cmd,
                cwd=str(work_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=timeout,
            )
            return res.returncode, res.stdout, res.stderr
        except Exception as e:
            return -1, "", str(e)

    def count_file_lines(self, rel_path: Union[str, Path]) -> int:
        """Count physical lines in a file."""
        return len(self.read_text(rel_path).splitlines())

    def grep_pattern(
        self,
        pattern: str,
        rel_glob: str = "**/*",
        case_sensitive: bool = True,
        excludes: Optional[List[str]] = None,
    ) -> List[Tuple[str, int, str]]:
        """Search for a regex pattern across matching files. Returns (filepath, lineno, line)."""
        flags = 0 if case_sensitive else re.IGNORECASE
        regex = re.compile(pattern, flags)
        matches = []
        default_excludes = [
            ".git",
            "node_modules",
            ".next",
            "*.tsbuildinfo",
            "package-lock.json",
            "__pycache__",
        ]
        active_excludes = set(default_excludes + (excludes or []))

        for file_path in self.target_dir.glob(rel_glob):
            if not file_path.is_file():
                continue
            # Check exclusions
            parts = set(file_path.parts)
            if any(exc in parts or any(file_path.match(exc) for exc in active_excludes) for exc in active_excludes):
                continue

            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                for idx, line in enumerate(content.splitlines(), start=1):
                    if regex.search(line):
                        rel = str(file_path.relative_to(self.target_dir))
                        matches.append((rel, idx, line.strip()))
            except Exception:
                continue

        return matches

    def canonical_sha256(self, payload: Any) -> str:
        """Compute canonical JSON sha256 hash (RFC 8785 style sorted keys)."""
        canonical_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    # Assertion Helpers
    def assert_true(self, condition: bool, msg: str, details: Optional[Dict[str, Any]] = None):
        if not condition:
            raise TestAssertionError(msg, details)

    def assert_false(self, condition: bool, msg: str, details: Optional[Dict[str, Any]] = None):
        if condition:
            raise TestAssertionError(msg, details)

    def assert_equal(self, actual: Any, expected: Any, msg: str):
        if actual != expected:
            raise TestAssertionError(
                f"{msg}: expected '{expected}', got '{actual}'",
                {"expected": expected, "actual": actual},
            )

    def assert_not_equal(self, actual: Any, unexpected: Any, msg: str):
        if actual == unexpected:
            raise TestAssertionError(
                f"{msg}: expected value different from '{unexpected}'",
                {"unexpected": unexpected, "actual": actual},
            )

    def assert_in(self, item: Any, container: Any, msg: str):
        if item not in container:
            raise TestAssertionError(
                f"{msg}: '{item}' not found in target",
                {"item": item, "container_type": type(container).__name__},
            )

    def assert_not_in(self, item: Any, container: Any, msg: str):
        if item in container:
            raise TestAssertionError(
                f"{msg}: unexpected '{item}' found in target",
                {"item": item},
            )

    def assert_file_exists(self, rel_path: Union[str, Path], msg: Optional[str] = None):
        if not self.file_exists(rel_path):
            raise TestAssertionError(
                msg or f"Expected file does not exist: {rel_path}",
                {"path": str(rel_path)},
            )

    def assert_max_lines(self, rel_path: Union[str, Path], max_lines: int, msg: Optional[str] = None):
        lines = self.count_file_lines(rel_path)
        if lines > max_lines:
            raise TestAssertionError(
                msg or f"File {rel_path} exceeds maximum limit of {max_lines} lines (actual: {lines})",
                {"path": str(rel_path), "lines": lines, "max_lines": max_lines},
            )

    def assert_no_leaked_real_names(self):
        """Assert that no forbidden real commune/district names exist in source."""
        forbidden_names = ["Thịnh Đức", "Tân Cương", "Bất Bạt", "Ba Vì"]
        found = []
        for name in forbidden_names:
            matches = self.grep_pattern(name, rel_glob="src/**/*", case_sensitive=False)
            if matches:
                found.extend([(name, m[0], m[1]) for m in matches])
        if found:
            details = [f"Found '{name}' at {path}:{line}" for name, path, line in found[:5]]
            raise TestAssertionError(
                f"Forbidden real location names detected in source ({len(found)} occurrences): {', '.join(details)}",
                {"leaks": found},
            )


class TestRegistry:
    """Registry maintaining all test cases across Tiers 1-4."""

    def __init__(self):
        self.tests: List[TestCase] = []

    def register(
        self,
        test_id: str,
        tier: int,
        feature_id: int,
        name: str,
        description: str,
        source: str,
        tags: Optional[List[str]] = None,
    ):
        """Decorator to register a test case."""
        def decorator(fn: Callable[[TestHarness], None]):
            test_case = TestCase(
                test_id=test_id,
                tier=tier,
                feature_id=feature_id,
                name=name,
                description=description,
                source=source,
                test_fn=fn,
                tags=tags or [],
            )
            self.tests.append(test_case)
            return fn
        return decorator

    def get_tests(
        self,
        tier: Optional[int] = None,
        feature_id: Optional[int] = None,
        filter_pattern: Optional[str] = None,
    ) -> List[TestCase]:
        """Filter registered tests by tier, feature, or regex pattern."""
        res = self.tests
        if tier is not None:
            res = [t for t in res if t.tier == tier]
        if feature_id is not None:
            res = [t for t in res if t.feature_id == feature_id]
        if filter_pattern:
            pat = re.compile(filter_pattern, re.IGNORECASE)
            res = [t for t in res if pat.search(t.test_id) or pat.search(t.name) or pat.search(t.description)]
        return res


# Global test registry instance
registry = TestRegistry()
