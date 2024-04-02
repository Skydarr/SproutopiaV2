const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const { User } = require('../models/user');
const router = express.Router();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "dartesorero19@gmail.com",
      pass: "fzfe bsrv ztof axmt",
    },
  });

// Codes for sending email about customers Orders
const sendEmail = async (senderMail, orderDetails) => {
    try {
        // Send email
        const user = await User.findById(orderDetails.user);
        
        orderDetails.userName = user.name;
        orderDetails.userEmail = user.email;

        // Format the date of order
        const dateOrdered = new Date(orderDetails.dateOrdered);
        const formattedDateOforder = `${dateOrdered.getFullYear()}-${dateOrdered.getMonth() + 1}-${dateOrdered.getDate()}`;

        await transporter.sendMail({
            from: "dartesorero19@gmail.com",
            to: "tesorerodarryl@gmail.com",
            subject: "Order Details",
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <title>Order Details</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            width: 100%;
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f5f5f5;
                        }
                        header {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        header img {
                            max-width: 200px;
                            height: auto;
                        }
                        h1 {
                            margin-top: 0;
                        }
                        #project {
                            margin-bottom: 20px;
                        }
                        #project span {
                            font-weight: bold;
                        }
                        footer {
                            margin-top: 20px;
                            text-align: center;
                            font-size: 0.8em;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <header>
                            <img src="URL_TO_COMPANY_LOGO" alt="Company Logo"> <!-- Provide the URL of the company logo -->
                            <h1>Order Details</h1>
                        </header>
                        <div id="project">
                            <div><span>Customer Name:</span> ${orderDetails.userName} </div>
                            <div><span>Date of order:</span> ${formattedDateOforder}</div>
                            <div><span>Order Status:</span> ${orderDetails.status}</div>
                            <div><span>Customer Email:</span> ${orderDetails.userEmail}</div>
                            <div><span>Total Price:</span> ${orderDetails.totalPrice}</div>
                        </div>
                        <footer>
                            Appointment details were sent from a computer and are valid without signature and seal.
                        </footer>
                    </div>
                </body>
                </html>
            `,
        });

        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
    }
};


router.get(`/`, async (req, res) => {
    const orderList = await Order.find().populate('user', 'name').sort({ 'dateOrdered': -1 });

    if (!orderList) {
        res.status(500).json({ success: false })
    }
   
    res.status(201).json(orderList)
})

router.get(`/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems', 
            populate: {
                path: 'product', 
                populate: 'category'
            }
        });

    if (!order) {
        res.status(500).json({ success: false })
    }
    res.send(order);
})

// router.post('/', async (req, res) => {
//     try {
//         const email = req.body.email;

//         // Create Order Items
//         const orderItemsIds = await Promise.all(req.body.orderItems.map(async (orderItem) => {
//             let newOrderItem = new OrderItem({
//                 quantity: orderItem.quantity,
//                 product: orderItem.product
//             });

//             newOrderItem = await newOrderItem.save();
//             return newOrderItem._id;
//         }));

//         // Create Order
//         let order = new Order({
//             orderItems: orderItemsIds,
//             shippingAddress1: req.body.shippingAddress1,
//             shippingAddress2: req.body.shippingAddress2,
//             city: req.body.city,
//             zip: req.body.zip,
//             country: req.body.country,
//             phone: req.body.phone,
//             status: req.body.status,
//             user: req.body.user,
//         });

//         order = await order.save();

//         // Send Email Notification
//         await sendEmail(email, order);

//         if (!order)
//             return res.status(400).send('The order cannot be created!');

//         res.send(order);
//     } catch (error) {
//         console.error("Error creating order:", error);
//         res.status(500).send("Error creating order!");
//     }
// });

router.post('/', async (req, res) => {
    try {
        const email = req.body.email;

        // Create Order Items
        const orderItemsIds = await Promise.all(req.body.orderItems.map(async (orderItem) => {
            let newOrderItem = new OrderItem({
                quantity: orderItem.quantity,
                product: orderItem.product
            });

            newOrderItem = await newOrderItem.save();
            return newOrderItem._id;
        }));

        // Create Order
        let order = new Order({
            orderItems: orderItemsIds,
            shippingAddress1: req.body.shippingAddress1,
            shippingAddress2: req.body.shippingAddress2,
            city: req.body.city,
            zip: req.body.zip,
            country: req.body.country,
            phone: req.body.phone,
            status: req.body.status,
            user: req.body.user,
            totalPrice: req.body.totalPrice,
        });

        order = await order.save();

        // Send Email Notification
        await sendEmail(email, order);

        if (!order) {
            throw new Error('The order cannot be created!');
        }

        res.send(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).send("Error creating order!");
    }
});


router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        { new: true }
    )

    if (!order)
        return res.status(400).send('the order cannot be update!')

    res.send(order);
})


router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order => {
        if (order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({ success: true, message: 'the order is deleted!' })
        } else {
            return res.status(404).json({ success: false, message: "order not found!" })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })
})

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
    ])

    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({ totalsales: totalSales.pop().totalsales })
})

router.get(`/get/count`, async (req, res) => {
    const orderCount = await Order.countDocuments((count) => count)

    if (!orderCount) {
        res.status(500).json({ success: false })
    }
    res.send({
        orderCount: orderCount
    });
})

router.get(`/get/userorders/:userid`, async (req, res) => {
    const userOrderList = await Order.find({ user: req.params.userid }).populate({
        path: 'orderItems', populate: {
            path: 'product', populate: 'category'
        }
    }).sort({ 'dateOrdered': -1 });

    if (!userOrderList) {
        res.status(500).json({ success: false })
    }
    res.send(userOrderList);
})



module.exports = router;