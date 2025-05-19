"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRef, useState, useEffect } from "react";

import { InputText } from "primereact/inputtext";
import { Dropdown } from 'primereact/dropdown';
import { useFormik } from "formik";
import { classNames } from "primereact/utils";
import { Button } from "primereact/button";
import _ from "lodash";
import { Calendar } from "primereact/calendar";
import { Fieldset } from "primereact/fieldset";
import { Checkbox } from "primereact/checkbox";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { SKILLS } from "@/data/skills";
import { CITIES } from "@/data/cities";
import ALL_CITIES from "@/data/states.json";
import { AREAS } from "@/data/areas";
import api from "@/lib/axios";
import { Toast } from "primereact/toast";
import { MessageSeverity } from "primereact/api";
import { ProgressBar } from "primereact/progressbar";
import { devotees } from "@prisma/client";
import { convertDateObjectIntoDateString } from "@/lib/conversions";
import FullPageSpinner from "@/components/FullPageSpinner";
import ProfileCompletionMeter from "@/components/ProfileCompletionMeter";

export default function DevoteePage() {
    // const searchParams = useSearchParams();
    const toast = useRef<Toast>(null);
    const { devotee, isAuthenticated } = useAuth();
    // const devoteeId = Number.parseInt(searchParams.get('devoteeId')!);
    // const self:boolean = devotee?.id === devoteeId;

    const [initialValues, setInitialValues] = useState<typeof devotee>();
    const [filteredSkills, setFilteredSkills] = useState<string[] | null[]>();
    const [filteredCities, setFilteredCities] = useState<string[] | null[]>();
    const [filteredAreas, setFilteredAreas] = useState<string[] | null[]>();

    const formik = useFormik({
        initialValues: initialValues!,
        enableReinitialize: true,
        validate: (data) => {
            const errors = {};
            if (!data.name) {
                _.set(errors, "name", 'Name is required');
            }
            if (data.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(data.email)) {
                _.set(errors, "email", 'Invalid Email');
            }

            return errors;
        },
        onSubmit: async (values: typeof devotee, { setSubmitting }) => {
            try {
                let editedValues: (typeof devotee | undefined) = values ? { ...values } : undefined;
                for (const key in editedValues) {
                    if (_.isEqual(editedValues[key as keyof devotees], formik.initialValues[key as keyof devotees])) {
                        if (key !== 'id') {
                            delete editedValues[key as keyof devotees];
                        }
                    }
                }
                editedValues = convertDateObjectIntoDateString(editedValues!);
                await api.post('/devotee', editedValues); // automatically sends token
                toast.current?.show({
                    severity: MessageSeverity.SUCCESS,
                    summary: `Profile`,
                    detail: 'Updated Successfully. Refreshing now to process changes.',
                    life: 2000
                });
                setTimeout(() => {
                    window.location.reload();
                }, 2100);
            } catch {
                toast.current?.show({
                    severity: MessageSeverity.ERROR,
                    summary: `Profile`,
                    detail: 'Could not save your details. Try saving again or ultimately Refresh the page.',
                    life: 10000
                });
            } finally {
                setSubmitting(false);
            }
        },
    });

    const formContainsError: boolean = Object.keys(formik.errors).length !== 0;
    const formatFormErrorMessage = (errorMessage: string) => {
        return errorMessage ? <small className="p-error">{errorMessage}</small> : null;
    };

    const skillsSearch = (event: AutoCompleteCompleteEvent) => {
        let _filteredSkills: string[] | null | undefined;
        if (!event.query.trim().length) {
            _filteredSkills = SKILLS;
        }
        else {
            _filteredSkills = SKILLS.filter((skill) => {
                return skill.toLowerCase().includes(event.query.toLowerCase());
            });
        }
        setFilteredSkills(_filteredSkills);
    }

    const citiesSearch = (event: AutoCompleteCompleteEvent) => {
        let _filteredCities: string[];
        if (!event.query.trim().length) {
            _filteredCities = CITIES;
        }
        else {
            _filteredCities = CITIES.filter((city) => {
                return city.toLowerCase().startsWith(event.query.toLowerCase());
            });
        }
        setFilteredCities(_filteredCities);
    }

    const areasSearch = (event: AutoCompleteCompleteEvent) => {
        let _filteredAreas: string[];
        const city: string = formik.values?.address_city || '';
        if (city && _.get(AREAS, city.toUpperCase())) {
            if (!event.query.trim().length) {
                _filteredAreas = _.get(AREAS, city.toUpperCase());
            } else {
                _filteredAreas = _.get(AREAS, city.toUpperCase()).filter((area: string) => {
                    return area.toLowerCase().startsWith(event.query.toLowerCase());
                });
            }
            setFilteredAreas(_filteredAreas);
        }
    }
    const setValidState = (selectedCity: string) => {
        if (selectedCity) {
            const validCity: object = ALL_CITIES.filter((city: { city: string }) => {
                return city.city.toLowerCase() === selectedCity.toLowerCase();
            });
            if (validCity && Array.isArray(validCity) && validCity[0]) {
                formik.setFieldValue("address_state", validCity[0].state);
            }
        } else {
            formik.values.address_state = '';
        }
    }

    useEffect(() => {
        setInitialValues(devotee);
    }, [devotee])

    return (
        <div className="bg-white">
            {!isAuthenticated && devotee && <FullPageSpinner message="Hare Krishna! Fetching details..." />}
            
            {formik.isSubmitting && <FullPageSpinner message="Saving Changes" />}

            <form onSubmit={formik.handleSubmit} className="text-sm md:text-base m-2">
                {
                    formik.isSubmitting &&
                    <ProgressBar mode="indeterminate" style={{ height: '2px' }}></ProgressBar>

                }
                <div className="grid grid-cols-12 items-center pb-4 px-4">
                    <div className="col-span-8 md:col-span-10 mt-4 ml-1">
                        {
                            formContainsError ?
                                (
                                    <small className="text-red-700">
                                        <strong>Form contains errror. Please correct those and then save.</strong>
                                    </small>
                                )
                                :
                                (
                                    <ProfileCompletionMeter devotee={devotee} />
                                )
                        }
                    </div>
                    <div className="col-span-4 md:col-span-2 mr-1 mt-4">
                        <Button
                            className="float-right"
                            size="small"
                            type="submit"
                            label={formik.isSubmitting ? "Saving..." : "Save"}
                            icon="pi pi-save"
                            loading={formik.isSubmitting}
                            disabled={!formik.dirty || formContainsError}
                            raised
                        />
                    </div>
                </div>
                <div className="w-full h-auto">
                    <Fieldset legend={<span>Personal Details<i className="pi pi-user-edit pl-2"></i></span>} toggleable>
                        <div className="grid sm:grid-cols-12 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-phone"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="phone" disabled maxLength={14}
                                        value={formik.values?.phone?.slice(2)} />
                                    <label className="capitalize"
                                        htmlFor="phone">Phone Number</label>
                                </span>
                                {formik.values?.phone_verified &&
                                    <span className="p-inputgroup-addon border-0" title={'Verified'}>
                                        <i className="pi pi-check-circle text-green-500"></i>
                                    </span>
                                }
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className={classNames('p-inputgroup-addon', { 'form-field-error-icon-coloring': !!formik.errors["email"] })}>
                                    <i className="pi pi-at"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="email" maxLength={255}
                                        value={formik.values?.email}
                                        onChange={(e) => {
                                            formik.setFieldValue("email", e.target.value);
                                        }}
                                        className={classNames({ 'p-invalid': !!formik.errors["email"] })} />
                                    <label className="capitalize"
                                        htmlFor="email">{formatFormErrorMessage(formik.errors["email"]!) || 'Email'}</label>
                                </span>
                                {formik.values?.email_verified &&
                                    <span className="p-inputgroup-addon border-0" title={'Verified'}>
                                        <i className="pi pi-check-circle text-green-500"></i>
                                    </span>
                                }
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className={classNames('p-inputgroup-addon', { 'form-field-error-icon-coloring': !!formik.errors["name"] })}>
                                    <i className="pi pi-user"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="name" required maxLength={100}
                                        value={formik.values?.name}
                                        onChange={(e) => {
                                            formik.setFieldValue("name", e.target.value);
                                        }}
                                        className={classNames({ 'p-invalid': !!formik.errors["name"] })} />
                                    <label className="capitalize"
                                        htmlFor="name">{formatFormErrorMessage(formik.errors["name"]!) || 'Name'}</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-sun"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="initiated_name" maxLength={90}
                                        value={formik.values?.initiated_name}
                                        onChange={(e) => {
                                            formik.setFieldValue("initiated_name", e.target.value);
                                        }} />
                                    <label htmlFor="initiated_name">Initiated Name</label>
                                </span>
                                {/*{getFormErrorMessage(COLLECTION.DEVOTEES.INITIATED_NAME)}*/}
                            </div>

                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-calendar"></i>
                                </span>
                                <span className="p-float-label">
                                    <Calendar
                                        inputId="dob"
                                        name="dob"
                                        dateFormat="dd/mm/yy" maxDate={new Date()}
                                        value={formik.values?.dob}
                                        onChange={(e) => {
                                            formik.setFieldValue("dob", e.target.value);
                                        }}
                                    />
                                    <label htmlFor="dob">Date of Birth</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-heart"></i>
                                </span>
                                <span className="p-float-label">
                                    <Dropdown id="gender" showClear
                                        value={formik.values?.gender}
                                        options={[
                                            { name: 'Female', code: 'female' },
                                            { name: 'Male', code: 'male' },
                                            { name: 'Other', code: 'other' }
                                        ]}
                                        optionLabel="name" optionValue="code"
                                        onChange={(e) => {
                                            formik.setFieldValue("gender", e.value);
                                        }}
                                        placeholder="You identify as" />
                                    <label htmlFor="gender">Gender</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-heart-fill"></i>
                                </span>
                                <span className="p-float-label">
                                    <Dropdown id="marital_status" showClear
                                        value={formik.values?.marital_status}
                                        options={[
                                            { name: 'Yes', code: true },
                                            { name: 'No', code: false }
                                        ]}
                                        optionLabel="name" optionValue="code"
                                        onChange={(e) => {
                                            formik.setFieldValue("marital_status", e.value);
                                        }}
                                        placeholder="Are you married" />
                                    <label htmlFor="marital_status">Marital Status</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-language"></i>
                                </span>
                                <span className="p-float-label">
                                    <Dropdown id="language_preference" showClear
                                        value={formik.values?.language_preference}
                                        options={[
                                            { name: 'Hindi', code: 'hindi' },
                                            { name: 'English', code: 'english' },
                                            { name: 'Marathi', code: 'marathi' },
                                            { name: 'Tamil', code: 'tamil' },
                                            { name: 'Telegu', code: 'telegu' },
                                            { name: 'Gujarati', code: 'gujarati' },
                                            { name: 'Kannada', code: 'kannada' },
                                            { name: 'Other', code: 'other' },
                                        ]}
                                        optionLabel="name" optionValue="code"
                                        onChange={(e) => {
                                            formik.setFieldValue("language_preference", e.value);
                                        }}
                                        placeholder="Preferred Language for Class" />
                                    <label htmlFor="language_preference">Language Preference</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-briefcase"></i>
                                </span>
                                <span className="p-float-label">
                                    <Dropdown id="occupation" showClear
                                        value={formik.values?.occupation}
                                        options={[
                                            { name: 'Service', code: 'Service' },
                                            { name: 'Business', code: 'Business' },
                                            { name: 'Professional', code: 'Professional' },
                                            { name: 'Others', code: 'Others' }
                                        ]}
                                        optionLabel="name" optionValue="code"
                                        onChange={(e) => {
                                            formik.setFieldValue("occupation", e.value);
                                        }}
                                        placeholder="Your occupation" />
                                    <label htmlFor="occupation">Occupation</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-user"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="occupation_position" maxLength={100}
                                        value={formik.values?.occupation_position}
                                        onChange={(e) => {
                                            formik.setFieldValue("occupation_position", e.target.value);
                                        }} />
                                    <label htmlFor="occupation_position">Occupation Position</label>
                                </span>
                            </div>
                        </div>
                    </Fieldset>
                    <br />

                    <Fieldset legend={<span>Tax Benefits<i className="pi pi-file-check pl-2"></i></span>} toggleable collapsed >
                        <div className="p-inputgroup ml-0.5">
                            <Checkbox
                                id="tax_80g_required"
                                name="tax_80g_required"
                                checked={formik.values?.tax_80g_required ? true : false}
                                onChange={(e) => {
                                    formik.setFieldValue("tax_80g_required", e.checked);
                                }}
                            ></Checkbox>&nbsp;&nbsp;
                            <span>80G certificate required</span>
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-id-card"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="tax_pan" maxLength={10} keyfilter={/^[a-zA-Z0-9]*$/} disabled={!formik.values?.tax_80g_required}
                                    value={formik.values?.tax_pan} className="uppercase"
                                    onChange={(e) => {
                                        formik.setFieldValue("tax_pan", e.target.value);
                                    }} />
                                <label htmlFor="tax_pan">PAN Number (e.g. ABCDE1234F)</label>
                            </span>
                        </div>
                    </Fieldset>
                    <br />

                    <Fieldset legend={<span>Address<i className="pi pi-map-marker pl-2"></i></span>} toggleable collapsed >
                        <div className="grid sm:grid-cols-12 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-home"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="address_line1" maxLength={255}
                                        value={formik.values?.address_line1}
                                        onChange={(e) => {
                                            formik.setFieldValue("address_line1", e.target.value);
                                        }} />
                                    <label htmlFor="address_line1">Line 1</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-building"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="address_society" maxLength={255}
                                        value={formik.values?.address_society}
                                        onChange={(e) => {
                                            formik.setFieldValue("address_society", e.target.value);
                                        }} />
                                    <label htmlFor="address_society">Residential Society</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-truck"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="address_line2" maxLength={255}
                                        value={formik.values?.address_line2}
                                        onChange={(e) => {
                                            formik.setFieldValue("address_line2", e.target.value);
                                        }} />
                                    <label htmlFor="address_line2">Line 2</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-th-large"></i>
                                </span>
                                <span className="p-float-label">
                                    <AutoComplete id="address_city" forceSelection
                                        value={formik.values?.address_city}
                                        suggestions={filteredCities as null[]}
                                        completeMethod={citiesSearch}
                                        onChange={(e) => {
                                            formik.setFieldValue("address_city", e.value);
                                            setValidState(e.target.value!);
                                        }} />
                                    <label htmlFor="address_city">City</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-map-marker"></i>
                                </span>
                                <span className="p-float-label">
                                    <AutoComplete id="address_area" disabled={!formik.values?.address_city}
                                        value={formik.values?.address_area}
                                        suggestions={filteredAreas as null[]}
                                        completeMethod={areasSearch}
                                        onChange={(e) => formik.setFieldValue("address_area", e.value)} />
                                    <label htmlFor="address_area">Area</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-box"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="address_pincode" maxLength={6} keyfilter="int"
                                        value={formik.values?.address_pincode}
                                        onChange={(e) => {
                                            formik.setFieldValue("address_pincode", e.target.value);
                                        }} />
                                    <label htmlFor="address_pincode">Pin Code</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-table"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="address_state" disabled
                                        value={formik.values?.address_state} />
                                    <label htmlFor="address_state">State</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-flag"></i>
                                </span>
                                <span className="p-float-label">
                                    <Dropdown id="address_country" showClear
                                        value={formik.values?.address_country}
                                        options={[
                                            { name: 'India', code: 'India' },
                                            { name: 'USA', code: 'USA' },
                                            { name: 'Others', code: 'Others' }
                                        ]}
                                        optionLabel="name" optionValue="code"
                                        onChange={(e) => {
                                            formik.setFieldValue("address_country", e.value);
                                        }}
                                        placeholder="Your country" />
                                    <label htmlFor="address_country">Country</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-map"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="address_gmap_url" maxLength={1000}
                                        value={formik.values?.address_gmap_url}
                                        onChange={(e) => {
                                            formik.setFieldValue("address_gmap_url", e.target.value);
                                        }} />
                                    <label htmlFor="address_gmap_url">Google Maps URL</label>
                                </span>
                            </div>
                        </div>
                    </Fieldset>
                    <br />
                    <Fieldset legend={<span>Family Details<i className="pi pi-user-edit pl-2"></i></span>} toggleable collapsed>
                        <div className="grid sm:grid-cols-12 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-user"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="spouse_name" maxLength={100}
                                        value={formik.values?.spouse_name}
                                        onChange={(e) => {
                                            formik.setFieldValue("spouse_name", e.target.value);
                                        }} />
                                    <label htmlFor="spouse_name">Spouse&apos;s Name</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-calendar"></i>
                                </span>
                                <span className="p-float-label">
                                    <Calendar
                                        inputId="spouse_dob"
                                        name="spouse_dob"
                                        dateFormat="dd/mm/yy" maxDate={new Date()}
                                        value={formik.values?.spouse_dob}
                                        onChange={(e) => {
                                            formik.setFieldValue("spouse_dob", e.target.value);
                                        }}
                                    />
                                    <label htmlFor="spouse_dob">Spouse&apos;s Date of Birth</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-calendar"></i>
                                </span>
                                <span className="p-float-label">
                                    <Calendar
                                        inputId="spouse_marriage_anniversary"
                                        name="spouse_marriage_anniversary"
                                        dateFormat="dd/mm/yy" maxDate={new Date()}
                                        value={formik.values?.spouse_marriage_anniversary}
                                        onChange={(e) => {
                                            formik.setFieldValue("spouse_marriage_anniversary", e.target.value);
                                        }}
                                    />
                                    <label htmlFor="spouse_marriage_anniversary">Spouse&apos;s Marriage Anniversary</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-user"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="parents_father_name" maxLength={100}
                                        value={formik.values?.parents_father_name}
                                        onChange={(e) => {
                                            formik.setFieldValue("parents_father_name", e.target.value);
                                        }} />
                                    <label htmlFor="parents_father_name">Father&apos;s Name</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-calendar"></i>
                                </span>
                                <span className="p-float-label">
                                    <Calendar
                                        inputId="parents_father_dob"
                                        name="parents_father_dob"
                                        dateFormat="dd/mm/yy" maxDate={new Date()}
                                        value={formik.values?.parents_father_dob}
                                        onChange={(e) => {
                                            formik.setFieldValue("parents_father_dob", e.target.value);
                                        }}
                                    />
                                    <label htmlFor="parents_father_dob">Father&apos;s Date of Birth</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-user"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="parents_mother_name" maxLength={100}
                                        value={formik.values?.parents_mother_name}
                                        onChange={(e) => {
                                            formik.setFieldValue("parents_mother_name", e.target.value);
                                        }} />
                                    <label htmlFor="parents_mother_name">Mother&apos;s Name</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-calendar"></i>
                                </span>
                                <span className="p-float-label">
                                    <Calendar
                                        inputId="parents_mother_dob"
                                        name="parents_mother_dob"
                                        dateFormat="dd/mm/yy" maxDate={new Date()}
                                        value={formik.values?.parents_mother_dob}
                                        onChange={(e) => {
                                            formik.setFieldValue("parents_mother_dob", e.target.value);
                                        }}
                                    />
                                    <label htmlFor="parents_mother_dob">Mother&apos;s Date of Birth</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-calendar"></i>
                                </span>
                                <span className="p-float-label">
                                    <Calendar
                                        inputId="parents_marriage_anniversary"
                                        name="parents_marriage_anniversary"
                                        dateFormat="dd/mm/yy" maxDate={new Date()}
                                        value={formik.values?.parents_marriage_anniversary}
                                        onChange={(e) => {
                                            formik.setFieldValue("parents_marriage_anniversary", e.target.value);
                                        }}
                                    />
                                    <label htmlFor="parents_marriage_anniversary">Parent&apos;s Marriage Anniversary</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-user"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="children_1_name" maxLength={100}
                                        value={formik.values?.children_1_name}
                                        onChange={(e) => {
                                            formik.setFieldValue("children_1_name", e.target.value);
                                        }} />
                                    <label htmlFor="children_1_name">1st Child&apos;s Name</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-calendar"></i>
                                </span>
                                <span className="p-float-label">
                                    <Calendar
                                        inputId="children_1_dob"
                                        name="children_1_dob"
                                        dateFormat="dd/mm/yy" maxDate={new Date()}
                                        value={formik.values?.children_1_dob}
                                        onChange={(e) => {
                                            formik.setFieldValue("children_1_dob", e.target.value);
                                        }}
                                    />
                                    <label htmlFor="children_1_dob">1st Child&apos;s Date of Birth</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-user"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="children_2_name" maxLength={100}
                                        value={formik.values?.children_2_name}
                                        onChange={(e) => {
                                            formik.setFieldValue("children_2_name", e.target.value);
                                        }} />
                                    <label htmlFor="children_2_name">2nd Child&apos;s Name</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-calendar"></i>
                                </span>
                                <span className="p-float-label">
                                    <Calendar
                                        inputId="children_2_dob"
                                        name="children_2_dob"
                                        dateFormat="dd/mm/yy" maxDate={new Date()}
                                        value={formik.values?.children_2_dob}
                                        onChange={(e) => {
                                            formik.setFieldValue("children_2_dob", e.target.value);
                                        }}
                                    />
                                    <label htmlFor="children_2_dob">2nd Child&apos;s Date of Birth</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-user"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="children_3_name" maxLength={100}
                                        value={formik.values?.children_3_name}
                                        onChange={(e) => {
                                            formik.setFieldValue("children_3_name", e.target.value);
                                        }} />
                                    <label htmlFor="children_3_name">3rd Child&apos;s Name</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-calendar"></i>
                                </span>
                                <span className="p-float-label">
                                    <Calendar
                                        inputId="children_3_dob"
                                        name="children_3_dob"
                                        dateFormat="dd/mm/yy" maxDate={new Date()}
                                        value={formik.values?.children_3_dob}
                                        onChange={(e) => {
                                            formik.setFieldValue("children_3_dob", e.target.value);
                                        }}
                                    />
                                    <label htmlFor="children_3_dob">3rd Child&apos;s Date of Birth</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-user"></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id="children_4_name" maxLength={100}
                                        value={formik.values?.children_4_name}
                                        onChange={(e) => {
                                            formik.setFieldValue("children_4_name", e.target.value);
                                        }} />
                                    <label htmlFor="children_4_name">4th Child&apos;s Name</label>
                                </span>
                            </div>
                            <div className="p-inputgroup mt-2 sm:mt-7">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-calendar"></i>
                                </span>
                                <span className="p-float-label">
                                    <Calendar
                                        inputId="children_4_dob"
                                        name="children_4_dob"
                                        dateFormat="dd/mm/yy" maxDate={new Date()}
                                        value={formik.values?.children_4_dob}
                                        onChange={(e) => {
                                            formik.setFieldValue("children_4_dob", e.target.value);
                                        }}
                                    />
                                    <label htmlFor="children_4_dob">4th Child&apos;s Date of Birth</label>
                                </span>
                            </div>
                        </div>
                    </Fieldset>
                    <br />
                    <Fieldset legend={<span>Skills (as many as possible)<i className="pi pi-wrench pl-2"></i></span>} toggleable collapsed >
                        <div className="p-inputgroup mt-3">
                            <span className="p-float-label">
                                <AutoComplete id="skills" multiple
                                    value={formik.values?.skills}
                                    suggestions={filteredSkills}
                                    completeMethod={skillsSearch}
                                    onChange={(e) => formik.setFieldValue("skills", e.value)} />
                                <label htmlFor="skills">Start typing and choose skills from list</label>
                            </span>
                        </div>
                        <small>Note: Choose as many skills as you feel you can serve Shri Shri Radha Krishna with</small>
                    </Fieldset>
                    <br />
                    <Fieldset legend={<span>Communication Preferences<i className="pi pi-megaphone pl-2"></i></span>} toggleable collapsed >
                        <div className="p-inputgroup ml-0.5">
                            <Checkbox
                                id="whatsapp_consent"
                                name="whatsapp_consent"
                                checked={formik.values?.whatsapp_consent}
                                onChange={(e) => {
                                    formik.setFieldValue("whatsapp_consent", e.checked);
                                }}
                            ></Checkbox>&nbsp;&nbsp;
                            <span>I provide my consent to be communicated via WhatsApp.</span>
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-mobile"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="phone_whatsapp" maxLength={14} keyfilter="int" disabled={!formik.values?.whatsapp_consent}
                                    value=
                                    {
                                        !formik.values?.whatsapp_consent ? '' :
                                            (formik.values?.phone_whatsapp?.slice(2) || formik.values?.phone?.slice(2))
                                    }
                                    onChange={(e) => {
                                        formik.setFieldValue("phone_whatsapp", "91" + e.target.value);
                                    }} />
                                <label htmlFor="phone_whatsapp">WhatsApp Phone Number</label>
                            </span>
                        </div>
                    </Fieldset>
                    <br />
                    <Fieldset legend={<span>Memberships<i className="pi pi-id-card pl-2"></i></span>} toggleable collapsed >
                        Temple: &nbsp;
                        <a href="https://iskconpunebcec.com/#/Home" target="_blank" rel="noopener noreferrer" className="underline hover:text-hover">
                            ISKCON BCEC
                        </a>
                        {/* <div className="grid">
                            <div className="col-12">
                                Temples: {templeMemberships}
                            </div>
                            <div className="col-12">
                                Classes: {classMemberships}
                            </div>
                        </div> */}
                    </Fieldset>
                    <br />
                    <Fieldset legend={<span>For official purposes<i className="pi pi-lock pl-2"></i></span>} toggleable collapsed >
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                Counsellor ID: {formik.values?.counsellor_id}
                            </div>
                            <div className="capitalize">
                                Referred By: {formik.values?.source}
                            </div>
                        </div>
                    </Fieldset>
                </div>
                <div className="grid grid-cols-12 items-center pb-4 px-4">
                    <div className="col-span-8 md:col-span-10 mt-4 ml-1">
                        {
                            formContainsError ?
                                (
                                    <small className="text-red-700">
                                        <strong>Form contains errror. Please correct those and then save.</strong>
                                    </small>
                                )
                                :
                                (
                                    <small>
                                        <strong>Note: Phone Number</strong> can only be updated from User&nbsp;
                                        <i className="pi pi-cog"></i>&nbsp;Settings Page because it needs verification via OTP.
                                    </small>
                                )
                        }
                    </div>
                    <div className="col-span-4 md:col-span-2 mr-1 mt-4">
                        <Button
                            className="float-right"
                            size="small"
                            type="submit"
                            label={formik.isSubmitting ? "Saving..." : "Save"}
                            icon="pi pi-save"
                            loading={formik.isSubmitting}
                            disabled={!formik.dirty || formContainsError}
                            raised
                        />
                    </div>
                </div>
            </form>
            <Toast ref={toast} position="top-center" />
        </div>
    )
}