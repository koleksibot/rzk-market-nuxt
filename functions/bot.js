const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {Telegraf, Markup} = require("telegraf");
const axios = require("axios");
const cc = require("currency-codes");
const { GoogleSpreadsheet } = require('google-spreadsheet');
const Validator = require('validatorjs');

const mono = require('./mono');

// spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet('1NdlYGQb3qUiS5D7rkouhZZ8Q7KvoJ6kTpKMtF2o5oVM');

const bot = new Telegraf(functions.config().bot.token);
//firebase functions:config:set bot.token="1359239824:AAFqbJhFQxm3kgItUKiq6tdui5j3jPc5UEw"

bot.start((ctx) => ctx.reply("Welcome to RZK Market Ukraine!", Markup.keyboard([
  'sheet', 'USD', 'EUR', 'RUB'
  ]).resize().extra()
));

bot.use(async (ctx, next_call) => {
  const start = new Date();
  await next_call();
  const ms = new Date() - start;
  console.log('Response time: %sms', ms);
  ctx.reply(`Response time: ${ms}ms`);
  return;
});


  
  //Test Tags
  /* eslint-disable promise/always-return*/
  bot.hears('tags', async (ctx) => {
    admin.firestore().collection("products")
      .where("tags.a1", "==", true)
      .where("tags.c1", "==", true)
      .where("tags.b1", "==", true)
      .where("tags.Изделие", "==", "Выключатель")
      .get()
      .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
              // doc.data() is never undefined for query doc snapshots
              console.log(doc.id, " => ", doc.data());
          });
      })
      .catch((error) => {
          console.log("Error getting documents: ", error);
    });
    
    return ctx.reply("Tags rzk.com.ua Smart!", Markup.keyboard([
      'tags', 'sheet', 'USD', 'EUR', 'RUB'
    ]).resize().extra());
  
  });
  
  
  //Test Google Sheets
  bot.hears('sheet', async (ctx) => {
    await doc.useServiceAccountAuth(require('./telegram-bot-4e05c-885ebd800760.json'));
    
    await doc.loadInfo();// loads document properties and worksheets
   
    const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
    
    /* eslint-disable no-await-in-loop */
    let per_page = 100;
  
    for (let i = 0; i < sheet.rowCount - 1; i += per_page) {
  
      console.log(`rowCount ${sheet.rowCount - 1}, limit: ${per_page}, offset: ${i}`);
      
      try {
        const rows = await sheet.getRows({ limit: per_page, offset: i });
        //check if empty data
        if(rows.length === 0) {
          break;
        }
  
        // eslint-disable-next-line no-loop-func
        rows.forEach(async (row) => {
          //Validate
          let item = {
            id: row.ID,
            name: row.NAME,
            price: Number(row.PRICE),
            purchase_price: Number(row.PURCHASE_PRICE),
            unit: row.UNIT,
            group: row.GROUP,
          };
          
          let rules_is_item = {
            id: 'required',
            name: 'required',
            price: 'required',
          };
  
          let validation_is_item = new Validator(item, rules_is_item);
  
          if( validation_is_item.passes() ) {
            
            let rules_check_item = {
              id: 'alpha_dash',
              name: 'string',
              price: 'numeric',
            };
            
            let validation_check_item = new Validator(item, rules_check_item);
            
            if (validation_check_item.passes()) {
              console.log(item.id);
            }
  
            // await admin.firestore().doc('products/' + row.ID).update({
            //   "name": row.NAME,
            //   "purchase_price": Number(row.PURCHASE_PRICE),
            //   "price": Number(row.PRICE)
            // });
          }
          // ctx.replyWithHTML(`
          //   ${index}\n   
          //   <b>${row.ID}</b>
          //   ${row.NAME}
          //   ${row.PURCHASE_PRICE}
          //   ${row.PRICE}
          // `);
        });
      } catch (error) {
        console.log(error);
        break;
      }
    }
  });
  
  //listen all text messages
  bot.on('text', async (ctx) => {
    
    currency = await mono.mono();
    
    return ctx.replyWithMarkdown(`
    CURRENCY: *${currency[ctx.message.text]}*
  RATE BUY: *${currency[ctx.message.text].rateBuy}*
  RATE SELL: *${currency[ctx.message.text].rateSell}*
    `); 
  
  });
  
  bot.launch();
  
  exports.bot = functions.https.onRequest(async (req, res) => {
      await bot.handleUpdate(req.body);
      res.sendStatus(200);
  });
  
  // // Create and Deploy Your First Cloud Functions
  // // https://firebase.google.com/docs/functions/write-firebase-functions
  //exports.helloWorld = functions.https.onRequest((request, response) => {
  //  functions.logger.info("Hello logs!", {structuredData: true});
  //  response.send("Hello from Firebase!");
  //});