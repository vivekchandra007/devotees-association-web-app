'use client'

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { FileUpload, FileUploadFilesEvent } from 'primereact/fileupload'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import api from '@/lib/axios'
import { Toast } from "primereact/toast";
import { MessageSeverity } from "primereact/api";

interface Donation {
  id: number
  devotee_id: number
  amount: number
  mode: string
  date: string
  remarks?: string
}

export default function DonationsDashboard() {
  const [donations, setDonations] = useState<Donation[]>([])
  const toast = useRef<Toast>(null);

  const handleUpload = async (e: FileUploadFilesEvent) => {
    const file = e.files[0]
    const reader = new FileReader()

    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet)

      // Format and upload each row
      try {
        await api.post('/donations/bulk', { rows: json });
        toast.current?.show({
            severity: MessageSeverity.SUCCESS,
            detail: 'Donations uploaded successfully',
            life: 4000
        });
        fetchDonations()
      } catch {
        toast.current?.show({
            severity: MessageSeverity.ERROR,
            detail: 'Error uploading donations',
            life: 4000
        });
      }
    }

    reader.readAsArrayBuffer(file)
  }

  const fetchDonations = async () => {
    const res = await api.get('/donations')
    setDonations(res.data)
  }

  useState(() => {
    fetchDonations()
  })

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Donations Upload & Records</h2>

      <FileUpload
        name="excel"
        mode="advanced"
        auto
        chooseLabel="Upload Excel"
        customUpload
        uploadHandler={handleUpload}
        accept=".xlsx, .xls"
        emptyTemplate={<p className="m-0">Drag and drop donation Excel here</p>}
      />

      <DataTable value={donations} paginator rows={10} stripedRows responsiveLayout="scroll">
        <Column field="id" header="ID" />
        <Column field="devotee_id" header="Devotee ID" />
        <Column field="amount" header="Amount" />
        <Column field="mode" header="Mode" />
        <Column field="date" header="Date" />
        <Column field="remarks" header="Remarks" />
      </DataTable>
      <Toast ref={toast} position="bottom-center" />
    </div>
  )
}