# Development and Usage

[Design](https://uuapp.plus4u.net/uu-clubfiles-maing01/2bcccd3bb853626c072ac06c5ed92da6/document?oid=6652491e813552001697f40d&pageOid=66524920813552001697f41c) ([Old design](https://plus4u.net/ues/sesm?SessFree=ues%3AMT.CAPEK.ONDREJ.2%3AAFK))

[Database](https://cloud.mongodb.com/v2/648433fc6d28c3603ac3dd22#/metrics/replicaSet/653d9b73fd5d485ea76fec5a/explorer/afkbratcice), [Mongo DB API](https://www.mongodb.com/docs/manual/reference/method/js-collection/)

## Local development
1. do not use pnpm, because gcloud cannot work with pnpm
2. in root -> `npm start` -> run server & client
3. start on http://localhost:8080
4. if dtb connection fail, necessary to resume dtb on https://cloud.mongodb.com/v2/648433fc6d28c3603ac3dd22#/clusters

## Deploy
Deploy to [Google Cloud](https://console.cloud.google.com/home/dashboard?project=afkbratcice&supportedpurview=project)
- in root -> `npm run deploy` -> deploy to google cloud

Deployed service [https://afkbratcice.oa.r.appspot.com](https://afkbratcice.oa.r.appspot.com)

You can stream logs from the command line by running:
`$ gcloud app logs tail -s default`

See all [logs](https://console.cloud.google.com/logs/query?project=afkbratcice)

To view your application in the web browser run:
`$ gcloud app browse`

To take a quick anonymous survey, run:
`$ gcloud survey`

## TODO: 
2. fb login
