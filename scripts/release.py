#!/usr/bin/env python

import tempfile
import subprocess
import os
import json
import optparse

parser = optparse.OptionParser()
parser.add_option(
    '-d', '--debug-dir', dest='debug_dir', default=None
)
(options, args) = parser.parse_args()

debug_dir = options.debug_dir
is_debug = bool(debug_dir)

PRECOMPILED_REPO = ''
CONFIG_DIR = 'scripts/release-configs/'
BASIS_REPO_TEMPLATE_NAME = 'https://github.com/basisjs/{repository}.git'

repo_root = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')
)

bower_json_path = os.path.join(repo_root, 'bower.json')

with open(bower_json_path) as f:
    bower_conf = json.loads(f.read())
    version = bower_conf['version']

assert version, u'Cannot determine current release version. ' \
                u'Check your bower.json'

configs_dir = os.path.join(repo_root, CONFIG_DIR)
config_file_names = os.listdir(configs_dir)


def call(args, **kwargs):
    print u'EXCECUTING: ', u' '.join(args)
    print u'---------------------------------------------'
    result = subprocess.check_output(args, **kwargs)
    print result
    print u'---------------------------------------------'
    return result


def copy_built_files(output_script, repository_location):
    global output_file_name, command, output_file_path, rename
    for output_file_name in os.listdir(output_location):
        command = ['cp']
        output_file_path = os.path.join(output_location, output_file_name)

        print 'Coping {}'.format(output_file_name)
        if os.path.isdir(output_file_path):
            command.append('-r')

        if output_file_name == html_file_name:
            continue

        rename = output_file_name
        if output_file_name == 'script.js':
            rename = output_script

        command.append(output_file_path)
        command.append(os.path.join(repository_location, rename))

        call(command)


def update_conf(conf_name):
    conf_path = os.path.join(repository_location, conf_name)

    version_updated = False

    if not os.path.exists(conf_path):
        return version_updated

    with open(conf_path) as conf:
        contents = json.loads(conf.read())
        print u'I\'m changing {} version from {} to {}'.format(
            conf_name, contents['version'], version
        )
        version_updated = contents['version'] != version
        contents['version'] = version

    with open(conf_path, 'w') as conf:
        conf.write(json.dumps(contents, sort_keys=False, indent=2))

    return version_updated

for config_file_name in config_file_names:
    if not config_file_name.endswith('.json'):
        continue

    config_path = os.path.join(configs_dir, config_file_name)

    with open(config_path) as f:
        config = json.loads(f.read())
        output_location = tempfile.mkdtemp()

        repository = config['build'].get(
            'repository',
            BASIS_REPO_TEMPLATE_NAME.format(
                repository=os.path.splitext(config_file_name)[0]
            )
        )

        output_script = config['build']['outputScript']

        html_file_name = os.path.basename(config['build']['file'])

        repository_location = tempfile.mkdtemp()

        call([
            "git", "clone", "--depth", "1", repository, repository_location
        ])

        update_conf('bower.json')
        npm_publish_required = update_conf('package.json')

        call([
            'basis', '--config-file', config_path, 'build', '--output', output_location,
        ])
        copy_built_files(output_script, repository_location)

        call([
            'basis', '--config-file', config_path, 'build', '--output', output_location, '-p'
        ])
        copy_built_files(output_script.replace('.js', '.min.js'), repository_location)

        if is_debug:
            call(['cp', '-r', repository_location, debug_dir])

        # Not good. Should build tree of files instead and check each file
        call(["git", "add", "."], cwd=repository_location)

        tag_message = "version {version}".format(
            version=version
        )

        try:
            call([
                "git", "commit", "-am", tag_message,
            ], cwd=repository_location)
        except subprocess.CalledProcessError as e:
            if "nothing to commit" in e.output:
                print "No changes, nothing to commit {}".format(
                    config_file_name
                )
                continue
            raise

        call([
            "git", "tag", "-a", "v" + version, '-m', tag_message
        ], cwd=repository_location)

        if is_debug:
            continue

        # Publication operations. Cannot be undone.
        call([
            "git", "push",
        ], cwd=repository_location)

        call([
            "git", "push", "--tags",
        ], cwd=repository_location)

        if npm_publish_required:
            call([
                "npm", "publish",
            ], cwd=repository_location)
