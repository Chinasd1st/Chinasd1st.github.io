import tempfile
import unittest
from pathlib import Path

import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from OrganizeFilesByDate import extract_date_from_yaml


class ExtractDateFromYamlTests(unittest.TestCase):
    def _write_markdown(self, content: str) -> Path:
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        file_path = Path(temp_dir.name) / "post.md"
        file_path.write_text(content, encoding="utf-8")
        return file_path

    def test_supports_multiple_date_formats(self):
        cases = [
            ("2025-01-02", ("2025", "01")),
            ("2025/1/2", ("2025", "01")),
            ("2025.1.2", ("2025", "01")),
            ("2025-1-2 03:04:05", ("2025", "01")),
            ("2025-01-02T03:04:05+08:00", ("2025", "01")),
        ]

        for date_text, expected in cases:
            with self.subTest(date_text=date_text):
                file_path = self._write_markdown(
                    f"---\ntitle: test\ndate: {date_text}\n---\n# body\n"
                )
                self.assertEqual(extract_date_from_yaml(file_path), expected)

    def test_handles_front_matter_followed_by_content_separator(self):
        file_path = self._write_markdown(
            "---\ntitle: sample\ndate: 2025-12-09\n---\n---\n# heading\n"
        )

        self.assertEqual(extract_date_from_yaml(file_path), ("2025", "12"))


if __name__ == "__main__":
    unittest.main()
