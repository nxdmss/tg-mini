#!/usr/bin/env python3
"""Recovery deployment using matching engines from the current backend image."""
import json
import os
from pathlib import Path
import subprocess
import tempfile

REPO = Path('/opt/swa6/app')
COMPOSE = '/opt/swa6/docker-compose.yml'

def capture(*args):
    return subprocess.check_output(args, cwd=REPO, text=True).strip()

def main():
    # A second deployment must never race an existing build/deployment.
    for proc in Path('/proc').iterdir():
        if not proc.name.isdigit():
            continue
        try:
            args = (proc / 'cmdline').read_bytes().split(b'\0')
            if args and b'docker-compose' in args[0] and b'build' in args:
                raise RuntimeError('An existing Compose build is still running. Stop it first.')
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            pass
    revision = capture('git', 'rev-parse', 'origin/main')
    lock = json.loads(capture('git', 'show', revision + ':backend/package-lock.json'))
    expected = lock['packages']['node_modules/@prisma/engines-version']['version']
    image = capture('docker', 'inspect', 'swa6-backend-1', '--format', '{{.Image}}')
    query = 'libquery_engine-debian-openssl-3.0.x.so.node'
    schema = 'schema-engine-debian-openssl-3.0.x'
    check = '''const fs=require('fs');
const paths=['/opt/prisma-engines','/app/node_modules/@prisma/engines'];
const directory=paths.find(p=>process.argv.slice(1).every(f=>fs.existsSync(p+'/'+f)));
if(!directory) throw new Error('Existing image has no reusable Prisma engines');
console.log(JSON.stringify({directory,version:require('/app/node_modules/@prisma/engines-version/package.json').version}));'''
    actual = capture('docker', 'run', '--rm', '--network', 'none', '--entrypoint', 'node', image, '-e', check, query, schema)
    existing = json.loads(actual)
    if existing['version'] != expected:
        raise RuntimeError('Engine version mismatch; deployment stopped before any changes.')
    engines_directory = existing['directory']
    if engines_directory not in ['/opt/prisma-engines', '/app/node_modules/@prisma/engines']:
        raise RuntimeError('Unexpected engine directory')
    tag = 'swagystan-prisma-recovery:' + image.split(':')[-1][:16]
    subprocess.run(['docker', 'tag', image, tag], check=True)
    dockerfile = capture('git', 'show', revision + ':backend/Dockerfile') + '\n'
    deploy = capture('git', 'show', revision + ':scripts/deploy-yandex.sh') + '\n'
    additions = ('WORKDIR /app\n'
        f'COPY --from=existing_engines {engines_directory} /opt/prisma-engines\n'
        f'ENV PRISMA_QUERY_ENGINE_LIBRARY=/opt/prisma-engines/{query}\n'
        f'ENV PRISMA_SCHEMA_ENGINE_BINARY=/opt/prisma-engines/{schema}\n')
    if dockerfile.count('WORKDIR /app') != 2 or dockerfile.count('RUN npm ci') != 2:
        raise RuntimeError('Dockerfile changed; stopped.')
    dockerfile = 'FROM ' + tag + ' AS existing_engines\n\n' + dockerfile.replace('WORKDIR /app\n', additions)
    dockerfile = dockerfile.replace('RUN npm ci\n', 'RUN timeout 600s npm ci --ignore-scripts --no-audit --no-fund --loglevel=info \\\n  && timeout 120s node node_modules/prisma/build/index.js generate\n')
    dockerfile = dockerfile.replace('RUN npm ci --omit=dev \\', 'RUN timeout 600s npm ci --omit=dev --ignore-scripts --no-audit --no-fund --loglevel=info \\\n  && timeout 120s node node_modules/prisma/build/index.js generate \\')
    build_line = 'docker compose -f "$D" build "$S"'
    if deploy.count(build_line) != 1:
        raise RuntimeError('Deployment script changed; stopped.')
    with tempfile.TemporaryDirectory(prefix='swag-prisma-recovery-') as folder:
        folder = Path(folder)
        custom = folder / 'Dockerfile'
        custom.write_text(dockerfile)
        override = folder / 'compose.json'
        override.write_text(json.dumps({'services': {'backend': {'build': {'dockerfile': str(custom), 'network': 'host'}}}}))
        deploy = deploy.replace(build_line, 'docker compose -f "$D" -f "$SWAG_RECOVERY_OVERRIDE" build "$S"')
        deploy = deploy.replace('docker run --rm -e VITE_API_URL=', 'docker run --rm --network host -e VITE_API_URL=')
        # Pin the source checkout to the revision whose lockfile was verified.
        deploy = deploy.replace('R="$T/repo"', 'R="$T/repo"\ngit -C "$R" fetch -q origin "$SWAG_RECOVERY_REVISION"\ngit -C "$R" checkout -q --detach "$SWAG_RECOVERY_REVISION"')
        script = folder / 'deploy.sh'
        script.write_text(deploy)
        subprocess.run(['bash', '-n', str(script)], check=True)
        env = dict(os.environ, SWAG_RECOVERY_OVERRIDE=str(override), SWAG_RECOVERY_REVISION=revision,
                   COMPOSE_BAKE='false', BUILDKIT_PROGRESS='plain')
        print('Matching Prisma engines verified. Starting deployment without engine downloads.', flush=True)
        subprocess.run(['bash', str(script)], cwd=REPO, env=env, check=True)

if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error))
