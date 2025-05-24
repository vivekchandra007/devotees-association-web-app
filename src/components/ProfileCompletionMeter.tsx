'use client'

import { ProgressBar } from 'primereact/progressbar'
import { Tooltip } from 'primereact/tooltip'
import { useMemo } from 'react'
import _ from 'lodash'
import React from 'react'

type Props = {
  devotee?: object | null
  className?: string
}

const fields = [
  'name',
  'phone',
  'whatsapp_consent',
  'phone_whatsapp',
  'email',
  'email_verified',
  'gender',
  'dob',
  'occupation',
  'occupation_position',
  'tax_80g_required',
  'tax_pan',
  'skills',
  'address_line1',
  'address_line2',
  'address_society',
  'address_area',
  'address_gmap_url',
  'address_city',
  'address_state',
  'address_pincode',
  'address_country',
  'language_preference',
  'marital_status',
  'parents_father_name',
  'parents_father_dob',
  'parents_mother_name',
  'parents_mother_dob',
  'parents_marriage_anniversary'
]

export default function ProfileCompletionMeter({ devotee, className }: Props) {
  const { percentage, missing } = useMemo(() => {
    const filledCount = fields.reduce((count, field) => {
      const value = _.get(devotee, field, null)
      return value !== null && value !== undefined && value !== '' ? count + 1 : count
    }, 0)

    const missing = fields.filter((field) => {
      const val = _.get(devotee, field, null)
      return val === null || val === undefined || val === ''
    })

    const percentage = Math.round((filledCount / fields.length) * 100)
    return { percentage, missing }
  }, [devotee])

  const valueTemplate = (percentage: string) => {
    return (
      <React.Fragment>
        <small>
          <strong>{percentage}%</strong>
        </small>
      </React.Fragment>
    );
  };

  return (
    <div className={`w-full space-y-2 ${className || ''}`}>
      <ProgressBar
        value={percentage}
        displayValueTemplate={valueTemplate}
        showValue
        data-pr-tooltip={`Missing: ${missing.join(', ') || 'None'}`}
        data-pr-position="top"
        className="h-4 text-sm cursor-pointer"
      />
      <Tooltip target="[data-pr-tooltip]" />
    </div>
  )
}