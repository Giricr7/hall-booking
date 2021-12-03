const express = require('express');
const app = express();
require('dotenv').config();
const routes = require('./Routes/routes')




loadAPP = async () => {
    
    try{

        app.use(express.json());
        app.use('/', routes);
    
        app.listen(process.env.PORT, (req, res) => {
        
            console.log('server connected successfully');
    
        })
    } catch (err) {
        console.error(err);
    }
    
    
    }
    
    loadAPP();