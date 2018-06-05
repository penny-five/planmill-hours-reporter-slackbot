# Planmill hours reporter Slackbot

Slackbot that can be used as an interface to register hours to Planmill CRM on behalf of the user.

## Motivation

## Requirements

* Node.js (>= 8.10) and npm
* Planmill subscription
* AWS Account
* Domain name
* Admin access to Slack

## Getting started

### Creating a new Planmill OAuth2 client

Register a new Planmill OAuth2 client at https://online.planmill.com/your_planmill_instance_name_here/api/registrations.jsp.

Set "OAuth2 redirect URI" to `https://your.domain.com/planmill-oauth-callback`.

Write down OAuth2 Client ID and Client Secret as you will need them later.

### Creating a Slack app and receiving Slack OAuth access token

1.  Go to https://api.slack.com/apps and create a new Slack application.
2.  Install the app to your workspace by going to "OAuth & Permissions" and choosing "Install App to Workspace".
3.  Write down the OAuth Access Token and the verification token you receive after installing the app. You will need them later.

### Configuring the Serverless application

Create configuration files for development and/or production environments:

```bash
cp config.example.yml config.development.yml && cp config.example.yml config.production.yml
```

Fill in the required config variables. If you followed the previous steps then you should have everything you need to complete this one.

### Deploying the Serverless application

Install dependencies:

```bash
npm install
```

Deploy with desired AWS profile and stage:

```bash
npm run serverless deploy --profile default --stage development
```

or

```bash
npm run serverless deploy --profile default --stage production
```

Creating and updating the stack can take up to 15-30 minutes.

After the stack has been succesfully created write down the "CloudFront domain name" as you will need it later.

### Setting up your Planmill OAuth2 redirect URI

Set up your DNS records so that any HTTP requests to Planmill client redirect URI are redirected to

### Creating a slash command for the Slack app

In your Slack app settings screen choose "Slash Commands" and then "Create New Command".

Set the command to anything you want e.g. `/report-hours`. "Short Description" and "Usage Hint" fields are optional.

Enter the URL of `slash-commands` endpoint (`https://your.domain.com/slash-commands`) into "Request URL" field.

### Enabling interactive components for the Slack app

In your Slack app settings screen choose "Interactive Components".

Enter the URL of `interactions` endpoint (`https://your.domain.com/interactions`) into "Request URL" field.

Enter the URL of `options` endpoint (`https://your.domain.com/options`) into "Options Load URL" field.

Finally choose "Enable Interactive Components".

### All done!

Everything should be working now, if not then carefully check that you've done everything as instructed.
