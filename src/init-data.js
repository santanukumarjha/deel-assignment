const { sequelize } = require('./model');

async function createContracts(transaction) {
  const { Contract } = sequelize.models;

  const contracts = [
    {
      terms: 'I will build',
      status: 'new',
      id: 1,
      ContractorId: 1,
      ClientId: 1
    },{
      terms: 'I will building',
      status: 'in_progress',
      id: 4,
      ContractorId: 1,
      ClientId: 1
    },{
      terms: 'I will built',
      status: 'terminated',
      id: 5,
      ContractorId: 1,
      ClientId: 1
    },
    {
      terms: 'I will design',
      status: 'in_progress',
      id: 2,
      ContractorId: 2,
      ClientId: 2
    },
    {
      terms: 'I will test',
      status: 'completed',
      id: 3,
      ContractorId: 3,
      ClientId: 3
    }
  ];

  for (const contract of contracts) {
    await Contract.create(contract, { transaction });
  }
}

async function createProfiles(transaction) {
  const { Profile } = sequelize.models;

  const profiles = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      profession: 'Builder',
      balance: 10000,
      type: 'contractor'
    },
    {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      profession: 'Designer',
      balance: 15000,
      type: 'contractor'
    },
    {
      id: 3,
      firstName: 'Alice',
      lastName: 'Johnson',
      profession: 'Tester',
      balance: 12000,
      type: 'contractor'
    },
    {
      id: 4,
      firstName: 'Jonathan',
      lastName: 'Whitehurst',
      profession: 'Director',
      balance: 10000,
      type: 'client'
    }
  ];

  for (const profile of profiles) {
    await Profile.create(profile, { transaction });
  }
}

async function createJobs(transaction) {
  const { Job } = sequelize.models;

  const jobs = [
    {
      id: 1,
      description: 'Build a house',
      price: 5000,
      paid: true,
      paymentDate: new Date('2024-10-24'),
      ContractId: 1
    },
    {
      id: 2,
      description: 'Design a website',
      price: 3000,
      paid: false,
      paymentDate: new Date('2024-10-24'),
      ContractId: 2
    },
    {
      id: 3,
      description: 'Test a software',
      price: 2000,
      paid: true,
      paymentDate: new Date('2024-10-24'),
      ContractId: 3
    },
    {
      id: 4,
      description: 'Build a house 2',
      price: 5000,
      paid: false,
      paymentDate: new Date('2024-10-24'),
      ContractId: 1
    }
  ];

  for (const job of jobs) {
    await Job.create(job, { transaction });
  }
}

(async function () {
  try {
    await sequelize.sync({ force: true });
    const t = await sequelize.transaction();

    await createProfiles(t);
    await createContracts(t);
    await createJobs(t);

    await t.commit();
    console.log('Transaction has been committed');
  } catch (error) {
    await t.rollback();
    console.error('Transaction has been rolled back', error);
  }
})();