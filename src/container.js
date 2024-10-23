const { Dao } = require('./dao');
class Container {
  constructor() {
    this.daoInstance = null;
  }
  static getInstance() {
    if(!this.daoInstance) {
      this.daoInstance = new Dao();
    }
    return this.daoInstance;
  }
} 
module.exports = { Container };