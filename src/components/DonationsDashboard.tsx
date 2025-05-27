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
import { ProgressBar } from 'primereact/progressbar'
import { useAuth } from '@/hooks/useAuth'
import { SYSTEM_ROLES } from '@/data/constants'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Messages } from 'primereact/messages'

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
  const { devotee, systemRole } = useAuth();
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [donations, setDonations] = useState<Donation[] | null>([]);
  const [allDonations, setAllDonations] = useState<Donation[] | null>([]);
  const toast = useRef<Toast>(null);
  const msgs = useRef<Messages>(null);

  const errorMessage = (
    <small>No donations found for this devotee. Clear search to view donations from all devotees.</small>
  );

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
    try {
      setInProgress(true);
      // Fetch all donations
      const res = await api.get('/donations')
      setDonations(res.data);
      setAllDonations(res.data);
    } catch {
      msgs.current?.clear();
      msgs.current?.show({ id: '1', sticky: true, severity: 'error', summary: 'Error fetching donations. Please try again.', closable: true });
      setDonations(null); // Reset donations to null if there's an error
    } finally {
      setInProgress(false);
    }
  }

  const nameWithLink = (rowData: Donation) => {
    return (
      <a href={`/devotee?devoteeId=${rowData.devotees?.id}`} rel="noopener noreferrer" className="text-hover underline">
        {rowData.devotees?.name}
      </a>
    );
  };

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // This function will be called when the search button is clicked
    if (!searchQuery.trim()) {
      setDonations(allDonations);
      return;
    }

    if (!inProgress) {
      setInProgress(true);
      // Make an API call to fetch the search results
      await api.get('/donations', {
        params: {
          query: searchQuery.trim(),
        },
      }).then((response) => {
        if (response.status === 200) {
          if (response.data.length > 0) {
            setDonations(response.data);
          } else {
            setDonations(null);
            msgs.current?.clear();
            msgs.current?.show({ id: '1', sticky: true, severity: 'error', summary: 'Error', content: errorMessage, closable: true });
          }
        } else {
          msgs.current?.show({ id: '1', sticky: true, severity: 'error', summary: 'Error while searching. Please try again.', closable: true });
          setDonations(null);
        }
      }
      ).catch(() => {
        msgs.current?.show({ id: '1', sticky: true, severity: 'error', summary: 'Error while searching. Please try again.', closable: true });
        setDonations(null);
      }).finally(() => {
        setInProgress(false);
      });
    }
  }

  useState(() => {
    fetchDonations()
  })

  return (
    <div className='p-3'>
      <strong className="text-general">Donations Dashboard</strong>
      {
        inProgress ?
          <ProgressBar mode="indeterminate" style={{ height: '2px' }} className="pt-1"></ProgressBar>
          :
          <hr />
      }
      <small className="text-general">
        A consolidated place for all the donations data. At your role level, {devotee?.name}, you have the privileges to:
        <ol>
          <li key="1"><strong className="text-hover">View</strong> all the donations data.</li>
          {
            systemRole === SYSTEM_ROLES.admin &&
            <li key="2"><strong className="text-hover">Upload</strong> donations data in bulk using Excel sheet</li>
          }
        </ol>
      </small>
      <div className="min-h-screen">
        <div className="p-4 space-y-4">
          {
            systemRole === SYSTEM_ROLES.admin &&
            <div>
              <h2 className="text-xl font-bold">Bulk Insert Donations Data</h2>
              <FileUpload
                name="excel"
                mode="advanced"
                auto
                chooseLabel="Upload Excel"
                customUpload
                uploadHandler={handleUpload}
                accept=".xlsx, .xls"
                emptyTemplate={<p className="m-0">Drag and drop Donations Excel file here</p>}
              />
            </div>
          }

          <form onSubmit={handleSearch} className="p-inputgroup text-sm mt-7 w-full">
            <span className="p-float-label">
              <InputText id="search-input" required maxLength={50}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  msgs.current?.clear();
                }}
              />
              <label
                htmlFor="search-input">Type query and press enter or click 🔍
              </label>
            </span>
            <Button
              icon="pi pi-search"
              severity="secondary"
              aria-label="Search"
              size="small"
              type="submit"
            />
          </form>
          {searchQuery && (
            <Button
              onClick={() =>  {
                setSearchQuery('');
                setDonations(allDonations);
                msgs.current?.clear();
              }}
              icon="pi pi-times-circle"
              rounded
              text
              severity="contrast"
              tooltip="Clear Search"
              className="flex float-right bottom-[65px] right-[40px] z-1 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            />
          )}
          <small>
            <strong>Note:</strong>&nbsp;You can search a donation by it&apos;s id, donation_receipt_number, phone number or name of donor, or donation amount
          </small>
          {
            donations && Array.isArray(donations) && donations.length > 0 &&
            <DataTable value={donations} paginator rows={10} stripedRows responsiveLayout="scroll">
              <Column field="id" header="ID" />
              <Column field="amount" header="Amount" />
              <Column field="phone" header="Phone Number" />
              <Column header="Name" body={nameWithLink} />
              <Column field="payment_mode" header="Mode" />
              <Column field="internal_note" header="Note" />
            </DataTable>
          }
          <Messages ref={msgs} />
          <Toast ref={toast} position="bottom-center" />
        </div>
      </div>
    </div>
  )
}