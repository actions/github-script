

export function createMetaJson(): string[] {
    return createMetaJson('./')
}

export function createMetaJson(root: string): string[] {
    var fs = require('fs');
    const execSync = require('child_process').execSync;

    const xmllint = execSync('sudo apt install libxml2-utils', { shell: '/bin/bash' });
    console.log(xmllint.toString());
    var command = `#!/bin/bash
    cd ` + root + `
    find . -name 'pom.xml' -type f > ` + root + `poms.txt
    `;
    const output = execSync(command, { shell: '/bin/bash' });
    console.log(output.toString());

    var poms = fs.readFileSync(root + 'poms.txt', 'utf8').toString();
    var ownersFile = fs.readFileSync(root + '.github/CODEOWNERS', 'utf8').toString();
    for (const pomRaw of poms.split('\n')) {
        var pom = pomRaw.replace("\.\/", "/");
        var name = pom.split("/")[2];
        if (pom.startsWith("/components") && pom.indexOf(name + "-deployment/") > -1) {
            var xml = fs.readFileSync(pomRaw, 'utf8');
            var owners = [];
            var reviewers = [];
            for (const ownerRaw of ownersFile.split('\n')) {
                var path = ownerRaw.split(' ')[0];

                if (path.length > 3 && ownerRaw.indexOf(' @') > -1 && pom.startsWith(path)) {
                    owners.push(ownerRaw.split(' ')[1])
                    reviewers.push(ownerRaw.split(' ')[1])
                }
            }
            var gid = `#!/bin/bash
            cd ` + root + `
            xmllint --xpath "/*[local-name()='project']/*[local-name()='groupId']/text()" ` + pom + `
            `
            var aid = `#!/bin/bash
            cd ` + root + `
            xmllint --xpath "/*[local-name()='project']/*[local-name()='artifactId']/text()" ` + pom + `
            `
            const groupId = execSync(gid, { shell: '/bin/bash' }).toString();
            console.log(groupId);
            const artifactId = execSync(aid, { shell: '/bin/bash' }).toString();
            console.log(artifactId);
            var meta = {};
            meta['manifestSource'] = pom.replace("/pom.xml", "").substring(1);
            meta['manifestTarget'] = "helm-chart/components/charts/" + name + "/" + name + "-deployment/templates/";
            meta['owners'] = owners;
            meta['reviewers'] = reviewers;
            meta['branchName'] = name + "-deployment";
            meta['mavenGroupId'] = groupId.trim();
            meta['mavenArtifactId'] = artifactId.trim();
            console.log(JSON.stringify(meta));
            fs.writeFileSync(root + pomRaw.replace("/pom.xml", "/meta.json").substring(1), JSON.stringify(meta));
        }
    }
}