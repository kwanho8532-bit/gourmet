import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import compression from 'compression'
import { errorHandler } from './utils/errorHandler'
import authRoute from './routers/authRoute'
import helmet from 'helmet'
import { corsOptions } from './configs/cors.config'

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/starter-pack'
mongoose.connect(dbUrl)

const db = mongoose.connection

db.on('error', (err) => {
    console.error("연결 에러 발생:", err);
});

db.once('open', () => {
    console.log("MongoDB 연결 성공!");
});

const app: express.Express = express()

// cloudinary를 사용할 때는 Helmet의 Cross-Origin-Resource-Policy 때문에 웹 브라우저에서 외부 이미지 로드가 차단될 수 있다.
// app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); 이렇게 지정해주면
// 다른 도메인(교차 출처)에서 오는 요청이어도 내 서버의 자원(또는 외부 자원)을 가져가서 보여줄 수 있도록 허용하겠다"는 의미가 됩니다.
app.use(helmet())
app.use(cors(corsOptions))
// 모든 응답(불필요한 응답에 대해서는 자동으로 압축 X)에 대해 Gzip 압축 적용
// Gzip은 파일 용량을 줄이기 위해 사용하는 압축 알고리즘(Gzip format)입니다
// Express의 compression 패키지나 Nginx 같은 웹 서버가 알아서 압축할 대상과 안 할 대상을 가려냄
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoute)

app.use(errorHandler)

app.listen(3000, () => {
    console.log('Listening on the 3000 port!')
})

export default app;