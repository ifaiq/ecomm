const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/User');
const { checkRole } = require('../middleware/roleMiddleware');
const stripe = require('stripe')('sk_test_wAxpee4LPwhfVyDhB9lnMQfQ0028Y6eW1R');

const router = express.Router();

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.send('Sign up successful!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Sign in
router.post('/signin', passport.authenticate('local'), (req, res) => {
  res.send('Sign in successful!');
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  res.send('Logged out successfully!');
});

// Assign role to user
router.put('/users/:userId/role', checkRole('superadmin'), async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
  
      // Find the user by their ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      // Update the role and save the user
      user.role = role;
      await user.save();
  
      res.send('Role assigned successfully');
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Add a product (accessible only to superadmin)
router.post('/products', checkRole('superadmin'), async (req, res) => {
    try {
      const { name, price, description } = req.body;
  
      const product = await stripe.products.create({
        name,
        price,
        description
      });
  
      res.send(product);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Get all products (accessible only to superadmin)
  router.get('/products', checkRole('superadmin'), async (req, res) => {
    try {
      const products = await stripe.products.list();
      res.send(products.data);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Update a product (accessible only to superadmin)
  router.put('/products/:productId', checkRole('superadmin'), async (req, res) => {
    try {
      const { productId } = req.params;
      const { name, price, description } = req.body;
  
      const product = await stripe.products.update(productId, {
        name,
        price,
        description
      });
  
      res.send(product);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Delete a product (accessible only to superadmin)
  router.delete('/products/:productId', checkRole('superadmin'), async (req, res) => {
    try {
      const { productId } = req.params;
  
      await stripe.products.del(productId);
  
      res.send('Product deleted successfully');
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });

// Subscribe to a product (accessible to customers)
router.post('/subscribe/:productId/:planId', checkRole('customer'), async (req, res) => {
    try {
      const { productId, planId } = req.params;
      const { token } = req.body;
  
      // Get the authenticated user from the request
      const user = req.user;
  
      // Create a customer in Stripe
      const customer = await stripe.customers.create();
  
      // Attach the payment source to the customer
      await stripe.customers.createSource(customer.id, { source: token });
  
      // Subscribe the customer to the plan
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: planId }]
      });
  
      // Save the subscription details in the user's account
      user.subscription = {
        productId,
        planId,
        subscriptionId: subscription.id
      };
      await user.save();
  
      res.send(subscription);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
  
module.exports = router;
