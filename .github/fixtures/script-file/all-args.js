module.exports = async ({github, octokit, getOctokit, context, core, exec, glob, io, require}) => {
  return [github, octokit, getOctokit, context, core, exec, glob, io, require]
    .map(arg => typeof arg)
    .every(t => t === 'function' || t === 'object')
}
