# Development and Usage

[Design](https://uuapp.plus4u.net/uu-clubfiles-maing01/2bcccd3bb853626c072ac06c5ed92da6/document?oid=6652491e813552001697f40d&pageOid=66524920813552001697f41c) ([Old design](https://plus4u.net/ues/sesm?SessFree=ues%3AMT.CAPEK.ONDREJ.2%3AAFK))

[Database](https://cloud.mongodb.com/v2/648433fc6d28c3603ac3dd22#/metrics/replicaSet/653d9b73fd5d485ea76fec5a/explorer/afkbratcice), [Mongo DB API](https://www.mongodb.com/docs/manual/reference/method/js-collection/)

[Storage](https://console.cloud.google.com/storage/browser/afkbratcice.appspot.com;tab=objects?forceOnBucketsSortingFiltering=true&project=afkbratcice&prefix=&forceOnObjectsSortingFiltering=false)

## Local development
1. in root -> `npm run dev` -> run server & client
2. start on http://localhost:8080
3. if dtb connection fail, necessary to resume dtb on https://cloud.mongodb.com/v2/648433fc6d28c3603ac3dd22#/clusters
4. if first run, then initialize it
    1. login
    2. find record in sys_identity directly in database and set profileList: ["authorities", "operatives"] -> authorities can initialize it
    3. init the app by button in UVE (automatically create AFK Bratčice team and set to app collection)

## Deploy
Deploy to [Google Cloud](https://console.cloud.google.com/home/dashboard?project=afkbratcice&supportedpurview=project)

### Before first deploy
1. Download and install [gcloud](https://cloud.google.com/sdk/docs/install-sdk) 
2. Set windows env variables
    1. Press Win + R, type sysdm.cpl, press Enter.
    2. Go to the Advanced tab → click Environment Variables.
    3. Under System variables, find Path, then click Edit.
    4. Click New, then add the path to the bin folder, for example:
    5. Set path to bin e.g. C:\Users\User\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin
    6. Click OK → OK → OK.
    7. Close all open Command Prompt or PowerShell windows (important — new PATH won’t load otherwise).
    8. Open a fresh Command Prompt or PowerShell and verify: `gcloud version`

### Deploy
- in root -> `npm run deploy` -> deploy to google cloud

Deployed service [https://afkbratcice.oa.r.appspot.com](https://afkbratcice.oa.r.appspot.com)

You can stream logs from the command line by running:
`$ gcloud app logs tail -s default`

See all [logs](https://console.cloud.google.com/logs/query?project=afkbratcice)

To view your application in the web browser run:
`$ gcloud app browse`

To take a quick anonymous survey, run:
`$ gcloud survey`