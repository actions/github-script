/* eslint-disable @typescript-eslint/no-explicit-any */
import {readFileSync, existsSync} from 'fs'
import {EOL} from 'os'

// Copied from https://github.com/actions/toolkit/tree/f31c2921c1228a97be08cdb38b919a83077354d9/packages/github/src
// to minimize breaking changes from the removal of @actions/github from this action
// That code originated from https://github.com/JasonEtco/actions-toolkit

export interface PayloadRepository {
  [key: string]: any
  full_name?: string
  name: string
  owner: {
    [key: string]: any
    login: string
    name?: string
  }
  html_url?: string
}

export interface WebhookPayload {
  [key: string]: any
  repository?: PayloadRepository
  issue?: {
    [key: string]: any
    number: number
    html_url?: string
    body?: string
  }
  pull_request?: {
    [key: string]: any
    number: number
    html_url?: string
    body?: string
  }
  sender?: {
    [key: string]: any
    type: string
  }
  action?: string
  installation?: {
    id: number
    [key: string]: any
  }
  comment?: {
    id: number
    [key: string]: any
  }
}

export class Context {
  /**
   * Webhook payload object that triggered the workflow
   */
  payload: WebhookPayload

  eventName: string
  sha: string
  ref: string
  workflow: string
  action: string
  actor: string
  job: string
  runAttempt: number
  runNumber: number
  runId: number
  apiUrl: string
  serverUrl: string
  graphqlUrl: string

  /**
   * Hydrate the context from the environment
   */
  constructor() {
    this.payload = {}
    if (process.env.GITHUB_EVENT_PATH) {
      if (existsSync(process.env.GITHUB_EVENT_PATH)) {
        this.payload = JSON.parse(
          readFileSync(process.env.GITHUB_EVENT_PATH, {encoding: 'utf8'})
        )
      } else {
        const path = process.env.GITHUB_EVENT_PATH
        process.stdout.write(`GITHUB_EVENT_PATH ${path} does not exist${EOL}`)
      }
    }
    this.eventName = process.env.GITHUB_EVENT_NAME as string
    this.sha = process.env.GITHUB_SHA as string
    this.ref = process.env.GITHUB_REF as string
    this.workflow = process.env.GITHUB_WORKFLOW as string
    this.action = process.env.GITHUB_ACTION as string
    this.actor = process.env.GITHUB_ACTOR as string
    this.job = process.env.GITHUB_JOB as string
    this.runAttempt = parseInt(process.env.GITHUB_RUN_ATTEMPT as string, 10)
    this.runNumber = parseInt(process.env.GITHUB_RUN_NUMBER as string, 10)
    this.runId = parseInt(process.env.GITHUB_RUN_ID as string, 10)
    this.apiUrl = process.env.GITHUB_API_URL ?? `https://api.github.com`
    this.serverUrl = process.env.GITHUB_SERVER_URL ?? `https://github.com`
    this.graphqlUrl =
      process.env.GITHUB_GRAPHQL_URL ?? `https://api.github.com/graphql`
  }

  get issue(): {owner: string; repo: string; number: number} {
    const payload = this.payload

    return {
      ...this.repo,
      number: (payload.issue || payload.pull_request || payload).number
    }
  }

  get repo(): {owner: string; repo: string} {
    if (process.env.GITHUB_REPOSITORY) {
      const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
      return {owner, repo}
    }

    if (this.payload.repository) {
      return {
        owner: this.payload.repository.owner.login,
        repo: this.payload.repository.name
      }
    }

    throw new Error(
      "context.repo requires a GITHUB_REPOSITORY environment variable like 'owner/repo'"
    )
  }
}
