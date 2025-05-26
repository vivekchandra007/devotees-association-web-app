'use client'

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { FileUpload, FileUploadFilesEvent } from 'primereact/fileupload'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import api from '@/lib/axios'
import { Toast } from "primereact/toast";
import { MessageSeverity } from "primereact/api";
import { Prisma } from '@prisma/client';
import _ from "lodash";
import { parseDateFromStringddmmyyyy } from '@/lib/conversions'

type Donation = Prisma.donationsGetPayload<{
  include: {
    devotees: {
      select: {
        id: true,
        name: true
      }
    }
  };
}>;

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
      let json: object[] = XLSX.utils.sheet_to_json(sheet);

      json = formatIntoProperJson(json);

      // Format and upload each row
      try {
        await api.post('/donations/bulk', { donations: json });
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

  const formatIntoProperJson = (json: object[]) => {
    const formattedJson: object[] = [];
    // iterate in reverse coz donations are in descending order of date
    for (let i = json.length - 1; i >= 0; i--) {
      // since we are itrating in reverse, once we reach header i.e. "_1": "Sr", means we iterated through all, so just come out of loop
      if (_.get(json[i], '_1') === "Sr") {
        break;
      }

      const date = _.get(json[i], '_3');
      const phone = _.get(json[i], '_9');
      const amount = _.get(json[i], '_15');
      const donation = {
        id: _.get(json[i], '_4', ''),
        donation_receipt_number: _.get(json[i], '_4', ''),
        name: _.get(json[i], '_8', ''),
        phone: phone ? `91${phone}` : '',
        cost_center: _.get(json[i], '_10', ''),
        scheme_name: _.get(json[i], '_13', ''),
        payment_mode: _.get(json[i], '_14', ''),
        amount: amount ? parseInt(String(amount).replace(/,/g, '').split('.')[0], 10) : null,
        instrument_number: _.get(json[i], '_16', ''),
        collected_by: _.get(json[i], '_19', ''),
        status: _.get(json[i], '_20', ''),
        date: date ? parseDateFromStringddmmyyyy(date) : (new Date())
      }
      formattedJson.push(donation);
    }
    return formattedJson;
  }

  const fetchDonations = async () => {
    const res = await api.get('/donations')
    setDonations(res.data)
  }

  const nameWithLink = (rowData: Donation) => {
    return (
      <a href={`/devotee?devoteeId=${rowData.devotees?.id}`} rel="noopener noreferrer" className="text-hover underline">
        {rowData.devotees?.name}
      </a>
    );
  };

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
        <Column field="amount" header="Amount" />
        <Column field="phone" header="Phone Number" />
        <Column header="Name" body={nameWithLink} />
        <Column field="payment_mode" header="Mode" />
        <Column field="internal_note" header="Note" />
      </DataTable>
      <Toast ref={toast} position="bottom-center" />
    </div>
  )
}