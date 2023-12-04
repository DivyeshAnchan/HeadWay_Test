import express from 'express'
import { model, model1, connectdb } from './db.js'
import bcrypt from 'bcrypt'
import { config } from 'dotenv'
import axios from 'axios'
import session from 'express-session'
import nodemailer from 'nodemailer'
import mongoose from 'mongoose'
// import { transporter } from './nodemailerconfig.js'
const app = express()
let enmailVal
config({
  path: './config/config.env',
})
let transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.user,
    pass: process.env.pass,
  },
})

// Email options

// Send email
let send = async (recipient, code) => {
  await transporter.sendMail(
    {
      from: process.env.user,
      to: `${recipient}`,
      subject: 'OTP Verify',
      html: `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nigga OTP Email</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f6f6f6;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #fff;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }

    .header {
      background-color: #2c3e50;
      color: #ffffff;
      padding: 20px 0;
      text-align: center;
    }

    .header img {
      max-width: 150px;
    }

    .content {
      padding: 20px;
      text-align: center;
    }

    .otp {
      font-size: 36px;
      font-weight: bold;
      color: #e74c3c;
    }

    .footer {
      text-align: center;
      padding: 20px;
      background-color: #3498db;
    }

    .footer a {
      color: #ffffff;
      text-decoration: none;
      margin: 0 10px;
      font-weight: bold;
    }
  </style>
</head>

<body>
  <div class="container">
    <!-- Header Section -->
    <div class="header">
      <img src="https://example.com/headway-logo.png" alt="Headway Logo">
    </div>

    <!-- Content Section -->
    <div class="content">
      

      <!-- OTP Section -->
      <p>Your One-Time Password (OTP):</p>
      <h2 class="otp">${code}</h2>
      <p>This OTP will expire in 3 minutes after generating.</p>
      <p>Please ignore this email if it was not initiated by you.</p>
    </div>

    <!-- Footer Section -->
    <div class="footer">
      <a href="https://example.com/terms-and-conditions">Terms & Conditions</a>
      <a href="https://example.com/privacy-policy">Privacy Policy</a>
    </div>
  </div>
</body>

</html>`,
    },
    (error, info) => {
      if (error) {
        console.error(`Error sending email (${i + 1}):`, error)
      } else {
        console.log(`Email sent ${info.response}):`)
      }
    }
  )
}

let urls = ''
connectdb()
//middlewares
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(
  session({
    secret: process.env.key1,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
)

//routes
app.get('/', (req, res) => {
  if (req.session.username) {
    res.render('index')
    console.log(req.session)
  } else res.redirect('/login')
})
app.get('/login', (req, res) => {
  urls = 'login'
  // console.log(urls)
  res.render('login')
})
app.get('/register', (req, res) => {
  urls = 'register'
  res.render('register')
})
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err)
    } else {
      res.redirect('/login')
    }
  })
})
app.post('/login', async (req, res) => {
  let { Username, Password } = req.body
  let users = await model.findOne({ username: Username })
  if (users) {
    let Bpassword = await bcrypt.compare(Password, users.password)
    if (Bpassword) {
      req.session.username = users.username
      // console.log(req.session)
      res.redirect('/')
    } else res.render('login', { msg: 'invalid users/password' })
  } else res.redirect('/register')
})
app.post('/register', async (req, res) => {
  urls = 'register'
  let { username, password, confirmPassword } = req.body
  if (password === confirmPassword) {
    let users = await model.findOne({ username })

    if (!users) {
      await model.create({
        username,
        password: await bcrypt.hash(password, 10),
      })
      res.render('register', { msg: 'User Created Successfully' })
    } else {
      res.redirect('/login')
    }
  }
})
const isauth = (req, res, next) => {
  if (req.session.username) next()
  else res.redirect('/logout')
}
app.get('/more', isauth, (req, res) => {
  res.render('more')
})
app.get('/forgot', (req, res) => {
  res.render('forgot')
})
app.post('/forgot', async (req, res) => {
  let { email } = req.body
  let users = await model.findOne({ username: email })
  if (users) {
    let code1 = Math.floor(Math.random() * 9)
    let code2 = Math.floor(Math.random() * 9)
    let code3 = Math.floor(Math.random() * 9)
    let code4 = Math.floor(Math.random() * 9)
    let finals = code1 + '' + code2 + '' + code3 + '' + code4
    enmailVal = email
    await model1.create({
      email,
      code: finals,
    })
    send(email, finals)

    res.redirect('/confirm')
    setTimeout(async () => {
      await mongoose.connection.dropCollection('forgots')
    }, 180000)
    console.log(`destroyed`)
  } else {
    res.render('forgot', { msg: 'User Doesnt Exist' })
  }
})
app.get('/confirm', (req, res) => {
  res.render('forgot2')
})
app.post('/confirm', async (req, res) => {
  let { otp } = req.body
  let users = await model1.findOne({ email: enmailVal })
  // console.log(users)
  if (otp == users.code) {
    res.redirect('/passChange')
    await mongoose.connection.dropCollection('forgots')
  } else {
    res.render('forgot2', { msg: 'Wrong OTP' })
  }
})
app.get('/passChange', (req, res) => {
  res.render('passChange')
})
app.post('/changepass', async (req, res) => {
  let { password, confirmpassword } = req.body
  if (password === confirmpassword) {
    let hashedPass = await bcrypt.hash(password, 10)
    if (
      await model.updateOne(
        { username: enmailVal },
        {
          $set: { password: hashedPass },
        }
      )
    )
      // console.log('sucess')
      res.redirect('/login')
  } else {
    res.render('passChange', { msg: 'Password Doesnt Match' })
  }
})
const googleClientId = process.env.id
const googleClientSecret = process.env.secret
const googleRedirectUri = 'http://localhost:4000/auth/google/redirect/'

app.get('/auth/google', (req, res) => {
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: googleRedirectUri,
    response_type: 'code',
    scope: 'profile email',
  })

  const authUrl = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`
  res.redirect(authUrl)
})

// Callback route after Google has authenticated the user
app.get('/auth/google/redirect', async (req, res) => {
  const { code } = req.query

  // Exchange the authorization code for an access token
  const tokenUrl = 'https://accounts.google.com/o/oauth2/token'
  const tokenParams = new URLSearchParams({
    code,
    client_id: googleClientId,
    client_secret: googleClientSecret,
    redirect_uri: googleRedirectUri,
    grant_type: 'authorization_code',
  })

  try {
    const tokenResponse = await axios.post(tokenUrl, tokenParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const { access_token, refresh_token } = tokenResponse.data

    // Use the access_token to fetch user data from Google API
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo'
    const userInfoResponse = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const userData = userInfoResponse.data
    let users = await model.findOne({ username: userData.email })
    if (urls === 'login') {
      if (users) {
        req.session.username = users.username
        // console.log(req.session)
        res.redirect('/')
      } else res.redirect('/register')
    } else {
      if (!users) {
        await model.create({
          username: userData.email,
          password: await bcrypt.hash(userData.id, 10),
        })
        res.redirect('/register')
      } else {
        res.redirect('/login')
      }
    }
    // You can handle the user data here
    // console.log(userData)

    // Redirect to the home page or wherever you want
  } catch (error) {
    console.error('Error exchanging code for token:', error.message)
    res.redirect('/')
  }
})

app.listen(4000, () => {
  console.log(`listening at port 4000`)
})
