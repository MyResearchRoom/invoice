import express from 'express';
import {
  addClient,
  getAllClients,
  getClientById,
  getClientsByCompany,
  updateClient,
  deleteClient,
  getClientByUniqueId,
  getAllClientUniqueIds,
  getClientsUniqueIdAndName,
  downloadClientsExcel
} from '../../controller/client/clientController.js';

const router = express.Router();

router.post('/add-client', addClient);
router.get('/all', getAllClients);                       // ?page=1&limit=10
router.get('/download-excel', downloadClientsExcel);     //download excel file
router.get('/:id', getClientById);                       // /api/clients/1
router.get('/company/:company', getClientsByCompany);    // /api/clients/company/MRR
router.put('/update/:id', updateClient);                 // /api/clients/update/1
router.delete('/delete/:id', deleteClient);              // /api/clients/delete/1


router.get("/unique/:clientUniqueId", getClientByUniqueId);

// /api/clients/delete/1
router.get("/new/unique-ids", getAllClientUniqueIds);
router.get("/newapi/idnamelist", getClientsUniqueIdAndName);




export default router;




