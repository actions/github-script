import {context} from '@actions/github'
import {GitHub} from '@actions/github/lib/utils'
import * as child from 'child_process'
import * as fs from 'fs'

export class Helper {
  currentBuild: typeof context
  github: InstanceType<typeof GitHub>

  public constructor(
    currentBuild: typeof context,
    github: InstanceType<typeof GitHub>
  ) {
    this.currentBuild = currentBuild
    this.github = github
  }

  public listPoms(root: string): {[key: string]: string}[] {
    const execSync = child.execSync
    const command =
      `#!/bin/bash
      cd ` +
      root +
      `
      find . -name 'pom.xml' -type f > ` +
      root +
      `poms.txt
      `
    const output = execSync(command, {shell: '/bin/bash'})
    console.log(output.toString())
    const ret: {[key: string]: any}[] = []
    const poms = fs.readFileSync(root + 'poms.txt', 'utf8').toString()
    for (const pomRaw of poms.split('\n')) {
      const pom = pomRaw.replace('./', '/')
      const pomEntity: {[key: string]: any} = {}
      pomEntity['path'] = pom.replace('/pom.xml', '').substring(1)
      pomEntity['raw'] = pomRaw
      pomEntity['pom'] = pom
      pomEntity['name'] = pom.split('/')[2]
      pomEntity['fullPath'] = root + pomRaw.substring(1)
      ret.push(pomEntity)
    }
    return ret
  }

  public createMetaJson(root: string) {
    const execSync = child.execSync
    console.log('Run number: ' + this.currentBuild.runNumber)
    const xmllint = execSync('sudo apt install libxml2-utils', {
      shell: '/bin/bash'
    })
    console.log(xmllint.toString())
    const ret: string[] = []
    const poms = this.listPoms(root)
    const ownersFile = fs
      .readFileSync(root + '.github/CODEOWNERS', 'utf8')
      .toString()
    for (const pomEntity of poms) {
      if (
        pomEntity['pom'].startsWith('/components') &&
        pomEntity['pom'].indexOf(name + '-deployment/') > -1
      ) {
        const owners = []
        const reviewers = []
        for (const ownerRaw of ownersFile.split('\n')) {
          const path = ownerRaw.split(' ')[0]

          if (
            path.length > 3 &&
            ownerRaw.indexOf(' @') > -1 &&
            pomEntity['pom'].startsWith(path)
          ) {
            owners.push(ownerRaw.split(' ')[1])
            reviewers.push(ownerRaw.split(' ')[1])
          }
        }
        const gid =
          `#!/bin/bash
              cd ` +
          root +
          `
              xmllint --xpath "/*[local-name()='project']/*[local-name()='groupId']/text()" .` +
          pomEntity['pom'] +
          `
              `
        const aid =
          `#!/bin/bash
              cd ` +
          root +
          `
              xmllint --xpath "/*[local-name()='project']/*[local-name()='artifactId']/text()" .` +
          pomEntity['pom'] +
          `
              `
        const groupId = execSync(gid, {shell: '/bin/bash'}).toString()
        console.log(groupId)
        const artifactId = execSync(aid, {shell: '/bin/bash'}).toString()
        console.log(artifactId)
        const meta: {[key: string]: any} = {}
        meta['manifestSource'] = pomEntity['path']
        meta['manifestTarget'] =
          'helm-chart/components/charts/' +
          pomEntity['name'] +
          '/' +
          pomEntity['name'] +
          '-deployment/templates/'
        meta['owners'] = owners
        meta['reviewers'] = reviewers
        meta['branchName'] = pomEntity['name'] + '-deployment'
        meta['mavenGroupId'] = groupId.trim()
        meta['mavenArtifactId'] = artifactId.trim()
        console.log(JSON.stringify(meta))
        ret.push(
          pomEntity['pomRaw'].replace('/pom.xml', '/meta.json').substring(1)
        )
        fs.writeFileSync(
          root +
            pomEntity['pomRaw'].replace('/pom.xml', '/meta.json').substring(1),
          JSON.stringify(meta)
        )
      }
    }
    return ret
  }

  public async startCheck(name: string, status: string) {
    const result = await this.github.rest.checks.create({
      owner: this.currentBuild.repo.owner,
      repo: this.currentBuild.repo.repo,
      name: name,
      head_sha: this.currentBuild.sha,
      status: status
    })
    return result
  }

  public async completeCheck(
    name: string,
    id: string,
    conclusionString: string
  ) {
    const result = await this.github.rest.checks.update({
      owner: this.currentBuild.repo.owner,
      repo: this.currentBuild.repo.repo,
      name: name,
      check_run_id: id,
      head_sha: this.currentBuild.sha,
      status: 'completed',
      conclusion: conclusionString
    })
    return result
  }
}
