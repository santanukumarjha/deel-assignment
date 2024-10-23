const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('./model');
class Dao {
  constructor() {
    const {Job, Contract, Profile} = sequelize.models;
    this.Contract = Contract;
    this.Job = Job;
    this.Profile = Profile;
  }
  findOneContract(id, profileId) {
    return this.Contract.findOne({
      where: {
          id,
          [Op.or]: [{ContractorId: profileId}, 
              {ClientId: profileId}]
        }
    });
  }

  findAllNonTerminatedContracts(profileId) {
    return this.Contract.findAll({
      where: {
        status: {
          [Op.ne]: 'terminated'
        },
        [Op.or]: [
          { ContractorId: profileId },
          { ClientId: profileId }
        ]
      }
    });
  }

  findAllUnpaidJobs(profileId) {
    return this.Job.findAll({
      include: {
        model: this.Contract,
        where: {
          [Op.or]: [
            { ContractorId: profileId },
            { ClientId: profileId }
          ],
          status: {
            [Op.in]: ['new', 'in_progress']
          }
        }
      },
      where: {
        paid: false
      }
    });
  }

  findOneJob(jobId) {
    return this.Job.findOne({
      where: { id: jobId, paid: false },
      include: { model: this.Contract, include: ['Client', 'Contractor'] }
    });
  }
  getBestProfession(start, end){
    const startDate = new Date(start);
    const endDate = new Date(end);
    return sequelize.query(`
      SELECT profession
      FROM Profiles AS Profile
      INNER JOIN Contracts AS Client ON Profile.id = Client.ClientId
      INNER JOIN Jobs ON Client.id = Jobs.ContractId
      WHERE Jobs.paid = 1 AND Jobs.paymentDate BETWEEN :startDate AND :endDate
      GROUP BY profession
      ORDER BY SUM(Jobs.price) DESC
      LIMIT 1
    `, {
      replacements: { startDate, endDate },
      type: Sequelize.QueryTypes.SELECT
    });
  }
  getBestClients(start, end, limit){
    const startDate = new Date(start);
    const endDate = new Date(end);
    return sequelize.query(`
      SELECT Profile.id, firstName || ' ' || lastName AS fullName, SUM(Jobs.price) AS total_paid
      FROM Profiles AS Profile
      INNER JOIN Contracts AS Client ON Profile.id = Client.ClientId
      INNER JOIN Jobs ON Client.id = Jobs.ContractId
      WHERE Jobs.paid = 1 AND Jobs.paymentDate BETWEEN :startDate AND :endDate
      GROUP BY Profile.id
      ORDER BY total_paid DESC
      LIMIT :limit
    `, {
      replacements: { startDate, endDate, limit: parseInt(limit, 10) },
      type: Sequelize.QueryTypes.SELECT
    });
  }
  getClient(clientId) {
    return this.Profile.findOne({ where: { id: clientId, type: 'client' } });
  }
  getAllUnpaidJobs(clientId) {
    return this.Job.findAll({
      where: { paid: false },
      include: {
        model: this.Contract,
        where: { ClientId: clientId }
      }
    })
  }
}
module.exports = { Dao };