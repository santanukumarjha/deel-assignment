const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile');
const { Container } = require('./container');
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)



app.get('/contracts/:id', getProfile, async (req, res) => {
    const { id } = req.params;
    const profileId = req.profile.id;
  
    try {
      const contract = await Container.getInstance().findOneContract(id, profileId);
      if (!contract) return res.status(404).json({ message: 'Contract not found' });
      res.json(contract);
    } catch (error) {
        console.error(error)
      res.status(500).json({ error: 'Server error' });
    }
});

app.get('/contracts',getProfile, async (req, res) => {
    const profileId = req.profile.id;
    try {
      const contracts = await Container.getInstance().findAllNonTerminatedContracts(profileId);
      res.json(contracts);
    } catch (error) {
        console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
});

app.get('/jobs/unpaid', getProfile, async (req, res) => {
    const profileId = req.profile.id; 
    try {
        const jobs = await Container.getInstance().findAllUnpaidJobs(profileId);
        res.json(jobs);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
    const { job_id } = req.params;
    const profileId = req.profile.id;
    const transaction = await sequelize.transaction();
  
    try {
      const job = await Container.getInstance().findOneJob(job_id);
  
      if (!job) return res.status(404).json({ message: 'Job not found or already paid' });
  
      const client = job.Contract.Client;
      const contractor = job.Contract.Contractor;
  
      if (client.id !== profileId) return res.status(403).json({ message: 'Access denied' });
      if (client.balance < job.price) return res.status(400).json({ message: 'Insufficient balance' });
  
      
      // Deduct from client and add to contractor balance
      await client.update({ balance: client.balance - job.price }, { transaction});
      await contractor.update({ balance: contractor.balance + job.price }, { transaction });
      // Mark job as paid
      await job.update({ paid: true, paymentDate: new Date() }, { transaction });
      await transaction.commit();
  
      res.json({ message: 'Payment successful' });
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      res.status(500).json({ error: 'Server error' });
    }
});

app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
    const { userId } = req.params;
    const amount = req.body.amount;
  
    try {
      const client = await Container.getInstance().getClient(userId);

      if (!client) return res.status(404).json({ message: 'Client not found' });
  
      // Calculate the total price of unpaid jobs
      const unpaidJobs = await Container.getInstance().getAllUnpaidJobs(userId);

      // total unpaid jobs
      const totalUnpaid = unpaidJobs.reduce((sum, job) => sum + job.price, 0);
  
      const maxDeposit = totalUnpaid * 0.25;
  
      if (amount > maxDeposit) return res.status(400).json({ message: `Deposit exceeds allowed limit of ${maxDeposit}` });
  
      // Update balance
      await client.update({ balance: client.balance + amount });
  
      res.json({ message: 'Deposit successful', newBalance: client.balance });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
});

app.get('/admin/best-profession', getProfile, async (req, res) => {
    const { start, end } = req.query;
    try {
      const bestProfession = await Container.getInstance().getBestProfession(start, end);
      res.json(bestProfession);
    } catch (error) {
        console.error(error)
      res.status(500).json({ error: 'Server error' });
    }
});

app.get('/admin/best-clients', async (req, res) => {
    const { start, end, limit = 2 } = req.query;
    try {
        // Query for best clients based on total paid
        const bestClients = await Container.getInstance().getBestClients(start, end, limit);
        res.json(bestClients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = app;
