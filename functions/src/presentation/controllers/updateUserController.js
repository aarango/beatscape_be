// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { auth } = require("@infrastructure/data/firebase/FirebaseConfig");
const cors = require("cors")({ origin: true });

exports.updateUser = onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send({
        error: "Method Not Allowed",
        message: "Only POST requests are accepted.",
        success: false,
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({
        error: "unauthenticated",
        message: "Request must be authenticated.",
        success: false,
      });
    }

    const token = authHeader.split("Bearer ")[1];

    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      return res.status(403).send({
        error: "invalid-auth",
        message: "Failed to verify token.",
        details: error.message,
        success: false,
      });
    }

    const { email, newPassword } = req.body;

    // Verificación de variables requeridas
    if (!email) {
      return res.status(400).send({
        error: "invalid-argument",
        message: "Email is required.",
        success: false,
      });
    }

    try {
      const user = await auth.getUserByEmail(email);

      // Comprobación y actualización de la contraseña
      if (newPassword) {
        if (newPassword.length < 6) {
          return res.status(400).send({
            error: "invalid-argument",
            message: "Password must be at least 6 characters long.",
            success: false,
          });
        }

        await auth.updateUser(user.uid, {
          password: newPassword,
        });
      }

      return res.status(200).send({
        message: `User information updated successfully for email: ${email}`,
        success: true,
        data: {
          uid: user.uid,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Error updating user information:", error);
      return res.status(500).send({
        error: "internal",
        message: "Error updating user information.",
        details: error.message,
        success: false,
      });
    }
  });
});
