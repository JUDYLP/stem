"""Copy an explicit static resource allowlist into a new directory. No dependencies."""
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    'index.html', 'styles.css', 'data/questions.json', 'data/hero-demo.v1.json',
    'src/ai/demo-scenario.js', 'src/ai/demo-scenarios.json', 'src/ai/provider.js', 'src/ai/judge.js', 'data/packs/unscripted-core.v1.json',
    'src/fx/verdict-fx.js', 'assets/fonts/doto-latin-wght-normal.woff2',
    'src/main.js', 'src/questions.js', 'src/storage.js', 'src/export.js', 'src/demo.js', 'src/i18n.js',
    'data/packs/unscripted-core.v1.0.0.json', 'data/packs/unscripted-intro.v1.json',
    'work/pack-runtime.mjs',
    'src/lights.js', 'src/history.js', 'src/history-rubric.js', 'src/dotfield.js',
]


def package(destination):
    target = (ROOT / destination).resolve()
    if not target.is_relative_to(ROOT) or target == ROOT:
        raise ValueError('Output must be a new directory inside the project')
    if target.exists():
        raise FileExistsError('Output already exists; choose a new directory (nothing deleted)')
    for name in FILES:
        source = ROOT / name
        if name == 'work/pack-runtime.mjs' and not source.is_file():
            raise ValueError('Run npm run build:pack-runtime before packaging the site')
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
