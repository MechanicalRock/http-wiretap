import { defineFeature, loadFeature } from "jest-cucumber"
import "isomorphic-fetch"
import * as AWS from "aws-sdk"
import { serviceEndpoints } from "./endpoints";

jest.setTimeout(10000)

const feature = loadFeature("cucumber/features/publish_s3_proxying.feature")
const bucketName = ""

const appendLeadingZeroes = (n: number) =>  n < 9 ? "0" + n : n

defineFeature(feature, scenario => {
  let body: any = {}
  let headers: any = {}
  let queryParams: string = ""

  beforeEach(() => {
    body = { id: Date.now(), firstName: 'Hamish', lastName: 'Tedeschi' }
    headers = { etag: '1323LKWO' }
    queryParams = "group=contractor&drink=beer"
  })

  scenario('Client requests are published to S3', async ({ when, then }) => {
    when(/the client sends a request to the proxy/, async () => {
      await fetch(`${serviceEndpoints.POST[201]}?${queryParams}`, {
        method: "POST",
        body: JSON.stringify(body),
        headers
      })
    })

    then(/the request data should be published to s3 at the correct path/, async () => {
      const s3 = new AWS.S3()
      const d = new Date()
      let fileKey: string

      const listObjectsResult = await s3.listObjects({
        Bucket: bucketName,
        Prefix: `${d.getFullYear()}/${appendLeadingZeroes(d.getMonth() + 1)}/${appendLeadingZeroes(d.getDate())}`
      }).promise()

      expect(listObjectsResult.$response.error).toBeUndefined()

      for(const content of listObjectsResult.Contents) {
        const objResult = await s3.getObject({
          Bucket: bucketName,
          Key: content.Key
        }).promise()

        const textBody = objResult.Body.toString()

        if(textBody.includes(`{"id":"${body.id}"}`)) {
          fileKey = content.Key
          break;
        }
      }

      expect(fileKey).toBeDefined()
      expect(fileKey).toMatch(/log_([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/)
    })
  })
})
