const AWS = require("aws-sdk");
const sharp = require("sharp");

const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name;
  const Key = event.Records[0].s3.object.key;

  const filename = Key.split("/")[Key.split("/").length - 1];
  const ext = Key.split(".")[Key.split(".").length - 1];
  const requiredFormat = (ext === "jpg") ? "jpeg" : ext;
  console.log(`name: ${filename}, ext: ${ext}`);

  try {
    const s3Object = await s3.getObject({ Bucket, Key }).promise();  // object를 buffer 형태로 가져옴
    console.log(`original: ${s3Object.Body.length}`);  // object의 용량
    const resizedImage = await sharp(s3Object.Body)  // 이미지 resizing
      .resize(400, 400, { fit: "inside"})  // resizing 하되, 원본 비율은 유지
      .toFormat(requiredFormat)  // format 지정
      .toBuffer();  // resizing 결과물이 다시 buffer 형태로 반환됨
    await s3.putObject({
      Bucket,
      Key: `thumb/${filename}`,
      Body: resizedImage
    }).promise();
    console.log(`put: ${resizedImage.length}`);
    return callback(null, `thumb/${filename}`);
  } catch(err) {
    console.error(err);
    return callback(err);
  }
}