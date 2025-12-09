/**
 * Supabase JWT Validator
 *
 * Validiert JWT Tokens von Supabase Auth
 * Prüft Subscription-Level für Feature-Gating
 */

import jwt from 'jsonwebtoken';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

/**
 * Middleware: Validiert Supabase JWT
 */
export async function validateSupabaseJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);

    // JWT verifizieren
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET, {
      algorithms: ['HS256']
    });

    // User Info an Request anhängen
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role || 'user',
      // Subscription Info (aus Supabase user_metadata)
      subscription: decoded.user_metadata?.subscription || 'free',
      features: getFeaturesBySubscription(decoded.user_metadata?.subscription)
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Please refresh your session'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Token verification failed'
      });
    }

    console.error('JWT Validation Error:', error);
    return res.status(500).json({
      error: 'Authentication Error'
    });
  }
}

/**
 * Feature-Gating basierend auf Subscription
 */
function getFeaturesBySubscription(subscription) {
  const features = {
    free: {
      maxDocuments: 3,
      maxAnalysesPerDay: 5,
      personas: ['orthodox'],
      methodologies: ['basic'],
      genesis: false,
      akih: false,
      export: ['txt']
    },
    basic: {
      maxDocuments: 10,
      maxAnalysesPerDay: 50,
      personas: ['orthodox', 'hermeneutic', 'critical'],
      methodologies: ['mayring', 'thematic'],
      genesis: false,
      akih: true,
      export: ['txt', 'docx']
    },
    pro: {
      maxDocuments: 50,
      maxAnalysesPerDay: 200,
      personas: ['orthodox', 'hermeneutic', 'critical', 'phenomenological', 'feminist'],
      methodologies: ['mayring', 'thematic', 'grounded-theory', 'discourse'],
      genesis: true,
      akih: true,
      export: ['txt', 'docx', 'pdf', 'maxqda']
    },
    ultimate: {
      maxDocuments: -1, // unlimited
      maxAnalysesPerDay: -1, // unlimited
      personas: 'all',
      methodologies: 'all',
      genesis: true,
      akih: true,
      export: 'all'
    }
  };

  return features[subscription] || features.free;
}

/**
 * Middleware: Prüft ob User Feature nutzen darf
 */
export function requireFeature(featureName) {
  return (req, res, next) => {
    const features = req.user?.features;

    if (!features) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Feature access denied'
      });
    }

    // Prüfe spezifisches Feature
    if (featureName === 'genesis' && !features.genesis) {
      return res.status(403).json({
        error: 'Upgrade Required',
        message: 'Genesis Engine requires Pro or Ultimate subscription',
        requiredPlan: 'pro'
      });
    }

    if (featureName === 'akih' && !features.akih) {
      return res.status(403).json({
        error: 'Upgrade Required',
        message: 'AKIH Scoring requires Basic or higher subscription',
        requiredPlan: 'basic'
      });
    }

    next();
  };
}

export default { validateSupabaseJWT, requireFeature };
