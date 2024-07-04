const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const jwt = require('jsonwebtoken');


const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

// MongoDB Atlas database connection
mongoose.connect("mongodb+srv://itsvikram:372$jaVkm@cluster0.rbuacsi.mongodb.net/ecomm");

// Default route
app.get("/", (req, res) => {
    res.send("Express App is Running");
});

// Multer setup for image storage
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Route for uploading an image
app.use('/images', express.static('upload/images'));
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

// Define the Product model schema
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        require: true,
    },
    name: {
        type: String,
        require: true,
    },
    image: {
        type: String,
        require: true,
    },
    category: {
        type: String,
        require: true,
    },
    new_price: {
        type: Number,
        require: true,
    },
    old_price: {
        type: Number,
        require: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
});

// Route for adding a new product
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;
    if(products.length>0)
    {
        let last_product_array=products.slice(-1);
        let last_product= last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id=1;
    }
    const newProduct = new Product({
        // we have to create one logic using thet we dont have to provide 
        id:id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });

    console.log(newProduct);

    await newProduct.save();
    console.log("Saved");

    res.json({
        success: true,
        name: req.body.name,
    });
});

//creating Api for deleting product
app.post('/removeproduct',async(req,res)=>{
     // to removw the peoduct we use find one delete
     await Product.findOneAndDelete({ id: req.body.id });
      console.log("Removed");
      res.json({
        success:true,
        name:req.body.name,
      })
})
//using that we will get all the products available in the database
//using that we can display the product in our front end
//Api
app.get('/allproducts',async(req,res)=>{
     let products = await Product.find({})
    console.log("All product Fetched");
    res.send(products);
})
//use user schema

//schema creating for user model

const Users = mongoose.model('Users',{
      name:{
        type:String,
      },
      email:{
        type:String,
        unique:true,
      },
      password:{
        type:String,
      },
      cartData:{
        type:Object,
      },
      date:{
        type:Date,
        default:Date.now
      }
})

//creating endpoint for registering the user

app.post('/signup',async (req,res)=>{
    //to check if email or password already exist or not

    let check = await Users.findOne({email:req.body.email});
      
    if(check){
        return res.status(400).json({success:false,error:"existinf user found with same email id"})
    }
    let cart = {};
    for(let i=0 ;i<300;i++){
        cart[i]=0;
    }
    const user = new Users({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })


    await user.save();

    //jwt authentication 

    const data ={
        user:{
            id:user.id,
        }
    }
    // token
    const token=jwt.sign(data,'secret_ecom');
    res.json({success:true,token});

     
})

//creating end  point user login
app.post('/login',async(req,res)=>{
       let user=await Users.findOne({email:req.body.email});

       if(user){
         const passCompare = req.body.password === user.password;
         if(passCompare){
            const data = {
                user:{
                    id:user.id,
                }
            }
            const token = jwt.sign(data,'secret_ecom')
            res.json({success:true,token});
         }
         else{
            res.json({success:false,errors:"Wrong Password"})
         }
       }
       else{
           res.json({success:false,errors:"Wrong Email Id"});
       }
})


// creating andpoint for newcollection data

app.get('/newcollections',async(req,res)=>{
     let products = await Product.find({});

     let newcollection = products.slice(1).slice(-8);

     console.log("newcollection Fetched");
     res.send(newcollection);
})

//creating endponit for popular in women section
app.get('/popularinwomen',async(req,res)=>{
    
    let products = await Product.find({category:"women"});
     
    let popular_in_women = products.slice(0,4);
     console.log("Popular in women Fetched");
     res.send(popular_in_women);

})

//creating middelware to fetch user

  const fetchUser = async (req,res,next)=>{
        const token = req.header('auht-token')      
       if(!token){
        res.status(401).send({errors:"Please authenticate using vaild token"});
       }
       else{
            try{
                const data = jwt.verify(token,'secret_ecom');
                req.user=data.user;
                next();
            } catch(error){
                 req.status(401).send({errors:"Please authenticate using vaild token"})
            }
       }

  }



//creating endpoint for adding products in cartdata

//creating endpoint for adding products in cartdata
app.post('/addtocart', fetchUser, async (req, res) => {
    try {
        // Fetch the user data from the database
        console.log('Request Body:', req.body);
        const user = await Users.findById(req.user.id);

        // Check if the product exists in the user's cartData
        if (user.cartData[req.body.productId] !== undefined) {
            // If the product already exists, increment the quantity
            user.cartData[req.body.productId]++;
        } else {
            // If the product doesn't exist, add it to the cartData with quantity 1
            user.cartData[req.body.productId] = 1;
        }

        // Save the updated user data
        await user.save();

        res.json({ success: true, message: "Product added to cart successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});



// Start the server
app.listen(port, (error) => {
    if (!error) {
        console.log("Server Running on port " + port);
    } else {
        console.log("Error: " + error);
    }
});
