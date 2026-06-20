import { Router } from 'express';

const router = Router();

router.post('/validate', (req, res) => {
  const { qrData } = req.body;

  try {
    const data = JSON.parse(qrData);

    if (!data.restaurantId || !data.branchId || !data.tableId) {
      return res.json({ valid: false, message: 'Invalid QR code format' });
    }

    if (data.timestamp && Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      return res.json({ valid: false, expired: true, message: 'QR code has expired' });
    }

    res.json({
      valid: true,
      restaurantId: data.restaurantId,
      branchId: data.branchId,
      tableId: data.tableId,
      tableNumber: data.tableNumber || '1',
      restaurantName: 'FoodZone',
      branchName: 'Sahil',
      language: data.language || 'az',
    });
  } catch (error) {
    res.json({ valid: false, message: 'Invalid QR code' });
  }
});

export { router as qrRoutes };
