const generators = require('yeoman-generator')
const Path = require('path')
const sortPackageJson = require('sort-package-json')

module.exports = class AppGenerator extends generators.Base {

  constructor(args, options) {
    super(args, options)
  }

  prompting() {
    let prompts = [
      {
        name: 'name',
        message: "Package name",
        default: Path.basename(this.destinationPath())
      },
      {
        name: 'description',
        message: "Description"
      },
      {
        name: 'keywords',
        message: "Package keywords (comma-separated)",
        filter(words) {
          return words.split(/\s*,\s*/g)
        }
      },
      {
        name: 'babel',
        message: "Add Babel functionality",
        type: 'confirm',
        default: true
      },
      {
        name: 'babelplugins',
        message: 'What plugins should I include?',
        type: 'checkbox',
        default: [],
        choices: [
          'async-generator-functions',
          'class-properties',
          'do-expressions',
          'export-extensions',
          'function-bind',
          'object-rest-spread',
          'flow-comments'
        ],
        when(answers) {
          return answers.babel
        }
      },
      {
        name: 'private',
        message: "Private (Do not publish to npm; Travis CI won't be added)?",
        type: 'confirm',
        default: false
      },
      {
        name: 'travisci',
        message: "Add Travis CI?",
        type: 'confirm',
        default: false,
        when(answers) {
          return !answers.private
        }
      },
      {
        name: 'cli',
        message: "Add a CLI?",
        type: 'confirm',
        default: false
      }
    ]
    return this.prompting(prompts).then(props => {
      this.props = props
    })
  }

  writing() {
    return {

      packagejson() {
        let pkg = {
          name: this.props.name,
          version: "1.0.0-1",
          description: this.props.description,
          scripts: { test: "echo \"Error: no test specified\" && exit 1" },
          homepage: `https://github.com/seangenabe/${this.props.name}`,
          author: "Sean Genabe <seangenabe@outlook.com>",
          repository: `seangenabe/${this.props.name}`,
          license: "MIT",
          engines: { node: ">=6.0.0" },
          main: this.props.babel ? 'dist/index.js' : 'index.js',
          keywords: []
        }
        if (this.props.private) {
          pkg.private = this.props.private
        }
        if (this.props.babel) {
          pkg.files = [ 'dist' ]
        }
        if (this.props.keywords) {
          pkg.keywords = this.props.keywords
        }
        if (this.props.babel) {
          pkg.babel = {
            plugins: [].concat(this.props.babelplugins)
          }
          for (let n of this.props.babelplugins) {
            pkg.devDependencies = pkg.devDependencies || {}
            pkg.devDependencies[`babel-plugin-transform-${n}`] = '^6.4'
          }
          pkg.scripts.build = 'babel lib -d dist'
          pkg.scripts.prepublish = 'npm run build'
        }

        pkg = sortPackageJson(pkg)
        this.fs.writeJSON(this.destinationPath('package.json'), pkg)
      },

      travisyml() {
        if (this.props.travisci) {
          this.fs.copyTpl(
            this.templatePath('.travis.yml'),
            this.destinationPath('.travis.yml')
          )
        }
      },

      readmemd() {
        this.fs.copyTpl(
          this.templatePath('readme.md'),
          this.destinationPath('readme.md'),
          this.props
        )
      },

      licensemd() {
        this.fs.copyTpl(
          this.templatePath('license.md'),
          this.destinationPath('license.md')
        )
      },

      boilerplateLib() {
        this.fs.copyTpl(
          this.templatePath('index.js'),
          this.destinationPath(this.props.babel ? 'lib/index.js' : 'index.js')
        )
      },

      gitattributes() {
        this.fs.copyTpl(
          this.templatePath('.gitattributes'),
          this.destinationPath('.gitattributes'),
          {
            cli: this.props.cli
          }
        )
      },

      cli() {
        if (this.props.cli) {
          this.fs.copyTpl(
            this.templatePath('bin/cli'),
            this.destinationPath('bin/cli')
          )
        }
      },

      gitignore() {
        this.fs.copyTpl(
          this.templatePath('.gitignore'),
          this.destinationPath('.gitignore'),
          {
            babel: this.props.babel
          }
        )
      },

      npmignore() {
        if (this.props.babel) {
          this.fs.copyTpl(
            this.templatePath('.npmignore'),
            this.destinationPath('.npmignore')
          )
        }
      }

    }
  }

  installing() {
    this.npmInstall()
  }

}
