# Development and Usage

[Design](https://uuapp.plus4u.net/uu-dockit-maing02/f16aa6298c1b47efa228a85636dad55c/document?documentId=653d8b58c908d2002873704b) ([Old design](https://plus4u.net/ues/sesm?SessFree=ues%3AMT.CAPEK.ONDREJ.2%3AAFK))

[Database](https://cloud.mongodb.com/v2/648433fc6d28c3603ac3dd22#/metrics/replicaSet/653d9b73fd5d485ea76fec5a/explorer/afkbratcice), [Mongo DB API](https://www.mongodb.com/docs/manual/reference/method/js-collection/)

Local development
1. do not use pnpm, because gcloud cannot work with pnpm
2. in client/*-hi -> `npm start` -> run app-hi
3. in root -> `npm start` -> run server
4. start on http://localhost:1234
5. if dtb connection fail, necessary to resume dtb on https://cloud.mongodb.com/v2/648433fc6d28c3603ac3dd22#/clusters

## Deployed
Deploy to Google Cloud
- in root -> `npm run deploy` -> deploy to google cloud

Deployed service [default] to [https://afkbratcice.oa.r.appspot.com]

You can stream logs from the command line by running:
`$ gcloud app logs tail -s default`

To view your application in the web browser run:
`$ gcloud app browse`

To take a quick anonymous survey, run:
`$ gcloud survey`

## TODO:
1. google/fb login
