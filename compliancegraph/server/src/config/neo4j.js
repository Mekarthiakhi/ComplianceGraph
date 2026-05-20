const neo4j = require('neo4j-driver');
const logger = require('../utils/logger')('Neo4j');
const { DatabaseError } = require('../utils/appError');

// Initialize driver with connection pooling
let driver = null;

const initializeDriver = () => {
  try {
    driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
      ),
      {
        maxPoolSize: parseInt(process.env.NEO4J_MAX_POOL_SIZE || 50),
        maxConnectionLifetime: 3600000, // 1 hour
        connectionTimeout: 30000,
        maxTransactionRetryTime: 30000,
        disableLosslessIntegers: true,
      }
    );

    // Verify connectivity
    driver.verifyConnectivity()
      .then(() => logger.info('Neo4j connection verified successfully'))
      .catch((err) => {
        logger.error('Neo4j connection verification failed', { error: err.message });
        process.exit(1);
      });

    return driver;
  } catch (err) {
    logger.error('Failed to initialize Neo4j driver', { error: err.message });
    throw err;
  }
};

const getSession = (mode = 'READ') => {
  if (!driver) {
    throw new Error('Neo4j driver not initialized. Call initializeDriver() first.');
  }
  return driver.session({
    defaultAccessMode: mode === 'WRITE' ? neo4j.session.WRITE : neo4j.session.READ,
  });
};

/**
 * Execute a Neo4j query with proper error handling and session cleanup
 * @param {string} cypher - Cypher query string
 * @param {object} params - Query parameters
 * @param {string} mode - Session mode: 'READ' or 'WRITE'
 * @returns {Promise<Array>} Query result records
 */
const runQuery = async (cypher, params = {}, mode = 'READ') => {
  if (!driver) {
    throw new DatabaseError('Neo4j driver not initialized');
  }

  const session = getSession(mode);

  try {
    logger.debug('Executing query', {
      cypher: cypher.substring(0, 150),
      paramsCount: Object.keys(params).length,
    });

    const result = await session.run(cypher, params);

    logger.debug('Query executed successfully', {
      recordCount: result.records.length,
    });

    return result.records;
  } catch (error) {
    logger.error('Query execution failed', {
      error: error.message,
      code: error.code,
      cypher: cypher.substring(0, 150),
    });

    // Handle specific Neo4j errors
    if (error.code?.includes('ConstraintValidationFailed')) {
      throw new DatabaseError(
        'Database constraint violation: This record may already exist',
        error
      );
    }

    if (error.code?.includes('DatabaseUnavailable')) {
      throw new DatabaseError('Database is currently unavailable', error);
    }

    if (error.code?.includes('ClientError')) {
      throw new DatabaseError(`Client error: ${error.message}`, error);
    }

    throw new DatabaseError(`Query execution failed: ${error.message}`, error);
  } finally {
    try {
      await session.close();
    } catch (closeErr) {
      logger.warn('Error closing session', { error: closeErr.message });
    }
  }
};

/**
 * Execute a transaction with multiple queries
 * @param {Function} callback - Transaction callback that receives transaction object
 * @param {string} mode - Session mode: 'WRITE' or 'READ'
 * @returns {Promise} Transaction result
 */
const runTransaction = async (callback, mode = 'WRITE') => {
  if (!driver) {
    throw new DatabaseError('Neo4j driver not initialized');
  }

  const session = getSession(mode);

  try {
    logger.debug('Starting transaction', { mode });

    const result = await session.executeWrite(callback);

    logger.debug('Transaction completed successfully');

    return result;
  } catch (error) {
    logger.error('Transaction failed', {
      error: error.message,
      code: error.code,
    });

    throw new DatabaseError(`Transaction failed: ${error.message}`, error);
  } finally {
    try {
      await session.close();
    } catch (closeErr) {
      logger.warn('Error closing session', { error: closeErr.message });
    }
  }
};

/**
 * Close the driver and all connections gracefully
 */
const closeDriver = async () => {
  if (!driver) return;

  try {
    await driver.close();
    logger.info('Neo4j driver closed gracefully');
    driver = null;
  } catch (error) {
    logger.error('Error closing Neo4j driver', { error: error.message });
  }
};

/**
 * Health check for Neo4j connection
 */
const healthCheck = async () => {
  try {
    if (!driver) {
      return { status: 'disconnected', message: 'Driver not initialized' };
    }

    await driver.verifyConnectivity();
    return { status: 'healthy', message: 'Connected to Neo4j' };
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    return { status: 'unhealthy', message: error.message };
  }
};

// Graceful shutdown handlers
const registerShutdownHandlers = () => {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal} signal - shutting down gracefully`);
    await closeDriver();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

// Initialize driver on module load
try {
  initializeDriver();
  registerShutdownHandlers();
} catch (error) {
  logger.error('Fatal error during driver initialization', { error: error.message });
  process.exit(1);
}

module.exports = {
  driver,
  getSession,
  runQuery,
  runTransaction,
  closeDriver,
  healthCheck,
  initializeDriver,
};
