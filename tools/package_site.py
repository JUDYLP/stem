"""Copy an explicit static resource allowlist into a new directory. No dependencies."""
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    'index.html', 'styles.css', 'data/questions.json',
    'src/main.js', 'src/questions.js', 'src/storage.js', 'src/export.js', 'src/demo.js', 'src/i18n.js',
    'src/lights.js', 'src/history.js',
]


def package(destination):
    target = (ROOT / destination).resolve()
    if not target.is_relative_to(ROOT) or target == ROOT:
        raise ValueError('Output must be a new directory inside the project')
    if target.exists():
        raise FileExistsError('Output already exists; choose a new directory (nothing deleted)')
    for name in FILES:
        source = ROOT / name
        if source.is_symlink() or not source.is_file():
            raise ValueError(f'Missing or symlinked resource: {name}')
    target.mkdir(parents=True)
    for name in FILES:
        dest = target / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, dest)
    (target / '.nojekyll').write_text('', encoding='utf-8')
    print(f'Packaged {len(FILES)} static resources: {target}')


if __name__ == '__main__':
    package(sys.argv[1] if len(sys.argv) > 1 else '_site')
