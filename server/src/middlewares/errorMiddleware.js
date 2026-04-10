export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const duplicateFieldLabels = {
  email: "Cette adresse email est deja utilisee.",
  matricule: "Ce matricule est deja utilise.",
  phone: "Ce numero de telephone est deja utilise."
};

export const errorHandler = (error, req, res, next) => {
  console.error(error);

  if (error?.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0];
    const fallbackValue = duplicateField ? `Valeur deja utilisee pour ${duplicateField}.` : "Une valeur unique existe deja.";

    return res.status(400).json({
      message: duplicateFieldLabels[duplicateField] || fallbackValue,
      details: error.keyValue
    });
  }

  res.status(res.statusCode && res.statusCode !== 200 ? res.statusCode : 500).json({
    message: error.message || "Internal server error"
  });
};
