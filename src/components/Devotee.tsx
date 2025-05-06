'use-client';

import { useAuth } from "@/hooks/useAuth";
import { useRef, useState } from "react";

import {InputText} from "primereact/inputtext";
import { Dropdown } from 'primereact/dropdown';
import {useFormik} from "formik";
import {classNames} from "primereact/utils";
import {Button} from "primereact/button";
import _ from "lodash";
import {ScrollPanel} from "primereact/scrollpanel";
import {Calendar} from "primereact/calendar";
import {Fieldset} from "primereact/fieldset";
import {Checkbox} from "primereact/checkbox";
import {AutoComplete} from "primereact/autocomplete";
// import {Chip} from "primereact/chip";
import {SKILLS} from "@/data/skills";
import {CITIES} from "@/data/cities";
import ALL_CITIES from "@/data/states.json";
import {AREAS} from "@/data/areas";
import api from "@/lib/axios";
import { Toast } from "primereact/toast";
import { MessageSeverity } from "primereact/api";

interface DevoteeProps {
    devoteeId: number; // Adjust the type as needed (e.g., number, string, etc.)
}

export default function Devotee({ devoteeId }: DevoteeProps) {
    const toast = useRef<Toast>(null);
    
    const { devotee } = useAuth();
    const self: boolean = devotee?.id === devoteeId;

    const [filteredSkills, setFilteredSkills] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [filteredAreas, setFilteredAreas] = useState([]);

    const formik = useFormik({
        initialValues: devotee!,
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
        onSubmit: async (values, { setSubmitting }) => {
            formik.validateForm();
            try {
                // eslint-disable-next-line
              const { system_roles, spiritual_levels, created_at, updated_at, ...filteredValues} = values;
              await api.post('/devotee', filteredValues); // automatically sends token
              showToastMessage('Updated Successfully', `Profile`, MessageSeverity.SUCCESS, 5000, false);
              setTimeout(()=> {
                window.location.reload()
              }, 2000);
            } catch {
              showToastMessage('Could not save details. Refresh page and try again.', `Profile`, MessageSeverity.ERROR, 5000, false);
            } finally {
              setSubmitting(false);
            }
        },
    });
    
    // eslint-disable-next-line
    const isFormFieldInvalid = (name: string | number) => !!(formik.touched.name && formik.errors.name);
    const getFormErrorMessage = (name: string | number) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{_.get(formik.errors, name)}</small> : '';
    };

    const save = () => {
        //props.submitAction(formik.values, props.userID, props.self);
        formik.handleSubmit();
        //formik.resetForm();
    }

    // eslint-disable-next-line
    const skillsSearch = (event: any) => {
        // eslint-disable-next-line
        let _filteredSkills:any;
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

    // eslint-disable-next-line
    const citiesSearch = (event: any) => {
        // eslint-disable-next-line
        let _filteredCities:any;
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

    // eslint-disable-next-line
    const areasSearch = (event: any) => {
        // eslint-disable-next-line
        let _filteredAreas: any;
        const city: string = formik.values.address_city || '';
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
            // eslint-disable-next-line
            const validCity:any = ALL_CITIES.filter((city: any) => {
                return city.city.toLowerCase() === selectedCity.toLowerCase();
            });
            if (validCity && Array.isArray(validCity) && validCity[0]) {
                formik.setFieldValue("state", validCity[0].state);
            }
        } else {
            formik.values.address_state = '';
        }
    }

    const showToastMessage = (message: string, summary?: string, severity?: MessageSeverity, life?: number, sticky?: boolean) => {
        toast.current?.show({
            severity: severity || MessageSeverity.ERROR,
            summary: (summary || MessageSeverity.ERROR).toUpperCase(),
            detail: message,
            life: life || 3000,
            sticky
        });
    }

    return (
        <form onSubmit={formik.handleSubmit}>
            <ScrollPanel style={{ width: '100%', height: 'auto', maxHeight: '60vh' }}>
                <Fieldset legend={<span>Personal Details<i className="pi pi-user-edit pl-2"></i></span>} toggleable className="has-no-padding has-no-margin">
                    <div className="grid sm:grid-cols-12 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-phone"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="phone" disabled maxLength={14}
                                           value={formik.values.phone?.slice(2)} />
                                <label className="capitalize"
                                       htmlFor="phone">Phone Number</label>
                            </span>
                            {   formik.values.phone_verified &&
                                <span className="p-inputgroup-addon border-0" title={'Verified'}>
                                    <i className="pi pi-check-circle text-green-500"></i>
                                </span>
                            }
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className={classNames('p-inputgroup-addon', {'form-field-error-icon': isFormFieldInvalid("email") })}>
                                <i className="pi pi-at"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="email" maxLength={90}
                                           value={formik.values.email}
                                           onChange={(e) => {
                                               formik.setFieldValue("email", e.target.value);
                                           }}
                                           className={classNames({ 'p-invalid': isFormFieldInvalid("email") })} />
                                <label className="capitalize"
                                       htmlFor="email">{getFormErrorMessage("email") || 'Email'}</label>
                            </span>
                            {   formik.values["email_verified"] &&
                                <span className="p-inputgroup-addon border-0" title={'Verified'}>
                                    <i className="pi pi-check-circle text-green-500"></i>
                                </span>
                            }
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className={classNames('p-inputgroup-addon', {'form-field-error-icon': isFormFieldInvalid("name") })}>
                                <i className="pi pi-user"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="name" required maxLength={60}
                                           value={formik.values.name}
                                           onChange={(e) => {
                                               formik.setFieldValue("name", e.target.value);
                                           }}
                                           className={classNames({ 'p-invalid': isFormFieldInvalid("name") })} />
                                <label className="capitalize"
                                       htmlFor="name">{getFormErrorMessage("name") || 'Name'}</label>
                            </span>
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-sun"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="initiated_name" maxLength={90}
                                           value={formik.values.initiated_name}
                                           onChange={(e) => {
                                               formik.setFieldValue("initiated_name", e.target.value);
                                           }} />
                                <label htmlFor="initiated_name">Initiated Name</label>
                            </span>
                            {/*{getFormErrorMessage(COLLECTION.DEVOTEES.INITIATED_NAME)}*/}
                        </div>

                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-calendar"></i>
                            </span>
                            <span className="p-float-label">
                                <Calendar
                                    inputId="dob"
                                    name="dob"
                                    dateFormat="dd/mm/yy" maxDate={new Date()}
                                    value={ formik.values.dob }
                                    onChange={(e) => {
                                        formik.setFieldValue("dob", e.target.value);
                                    }}
                                />
                                <label htmlFor="dob">Date of Birth</label>
                            </span>
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-heart"></i>
                            </span>
                            <span className="p-float-label">
                                <Dropdown id="gender" showClear
                                          value={formik.values.gender}
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
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-heart-fill"></i>
                            </span>
                            <span className="p-float-label">
                                <Dropdown id="marital_status" showClear
                                          value={formik.values.marital_status}
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
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-language"></i>
                            </span>
                            <span className="p-float-label">
                                <Dropdown id="language_preference" showClear
                                          value={formik.values.language_preference}
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
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-briefcase"></i>
                            </span>
                            <span className="p-float-label">
                                <Dropdown id="occupation" showClear
                                          value={formik.values.occupation}
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
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-user"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="occupation_position" maxLength={100}
                                    value={formik.values.occupation_position}
                                    onChange={(e) => {
                                        formik.setFieldValue("occupation_position", e.target.value);
                                    }} />
                                <label htmlFor="occupation_position">Occupation Position</label>
                            </span>
                        </div>
                    </div>
                </Fieldset>
                <br />
                <Fieldset legend={<span>Address<i className="pi pi-map-marker pl-2"></i></span>} toggleable collapsed className="has-no-padding has-no-margin">
                    <div className="grid sm:grid-cols-12 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-home"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="address_line1" maxLength={255}
                                           value={formik.values.address_line1}
                                           onChange={(e) => {
                                               formik.setFieldValue("address_line1", e.target.value);
                                           }} />
                                <label htmlFor="address_line1">Line 1</label>
                            </span>
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-building"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="address_society" maxLength={255}
                                           value={formik.values.address_society}
                                           onChange={(e) => {
                                               formik.setFieldValue("address_society", e.target.value);
                                           }} />
                                <label htmlFor="address_society">Residential Society</label>
                            </span>
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-truck"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="address_line2" maxLength={255}
                                           value={formik.values.address_line2}
                                           onChange={(e) => {
                                               formik.setFieldValue("address_line2", e.target.value);
                                           }} />
                                <label htmlFor="address_line2">Line 2</label>
                            </span>
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-th-large"></i>
                            </span>
                            <span className="p-float-label">
                                <AutoComplete id="address_city" forceSelection
                                              value={formik.values.address_city}
                                              suggestions={filteredCities}
                                              completeMethod={citiesSearch}
                                              onChange={(e) => {
                                                  formik.setFieldValue("address_city", e.value);
                                                  setValidState(e.target.value!);
                                              }} />
                                <label htmlFor="address_city">City</label>
                            </span>
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-map-marker"></i>
                            </span>
                            <span className="p-float-label">
                                <AutoComplete id="address_area" disabled={!formik.values.address_city}
                                              value={formik.values.address_area}
                                              suggestions={filteredAreas}
                                              completeMethod={areasSearch}
                                              onChange={(e) => formik.setFieldValue("address_area", e.value)} />
                                <label htmlFor="address_area">Area</label>
                            </span>
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-box"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="address_pincode" maxLength={6} keyfilter="int"
                                           value={formik.values.address_pincode}
                                           onChange={(e) => {
                                               formik.setFieldValue("address_pincode", e.target.value);
                                           }} />
                                <label htmlFor="address_pincode">Pin Code</label>
                            </span>
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-table"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="address_state" disabled
                                           value={formik.values.address_state} />
                                <label htmlFor="address_state">State</label>
                            </span>
                        </div>
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-flag"></i>
                            </span>
                            <span className="p-float-label">
                                <Dropdown id="address_country" showClear
                                          value={formik.values.address_country}
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
                        <div className="p-inputgroup mt-7">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-map"></i>
                            </span>
                            <span className="p-float-label">
                                <InputText id="address_gmap_url" maxLength={1000}
                                    value={formik.values.address_gmap_url}
                                    onChange={(e) => {
                                        formik.setFieldValue("address_gmap_url", e.target.value);
                                    }} />
                                <label htmlFor="address_gmap_url">Google Maps URL</label>
                            </span>
                        </div>
                    </div>
                </Fieldset>
                <br/>
                <Fieldset legend={<span>Skills (as many as possible)<i className="pi pi-wrench pl-2"></i></span>} toggleable collapsed className="has-no-padding has-no-margin">
                    <div className="p-inputgroup mt-4">
                        <span className="p-float-label">
                            <AutoComplete id="skills" multiple
                                          value={formik.values.skills}
                                          suggestions={filteredSkills}
                                          completeMethod={skillsSearch}
                                          onChange={(e) => formik.setFieldValue("skills", e.value)} />
                            <label htmlFor="skills">Start typing and choose skills from list, one by one. Choose as many as you feel you can serve Shri Shri Radha Krishna with</label>
                        </span>
                    </div>
                </Fieldset>
                <br/>
                <Fieldset legend={<span>Communication Preferences<i className="pi pi-megaphone pl-2"></i></span>} toggleable collapsed className="has-no-padding has-no-margin">
                    <div className="p-inputgroup mt-4">
                        <Checkbox
                            id="whatsapp_consent"
                            name="whatsapp_consent"
                            checked={formik.values.whatsapp_consent}
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
                            <InputText id="phone_whatsapp" maxLength={14} keyfilter="int" disabled={!formik.values.whatsapp_consent}
                                       value=
                                           {
                                               !formik.values.whatsapp_consent? '':
                                                   (formik.values.phone_whatsapp?.slice(2) || formik.values.phone?.slice(2))
                                           }
                                       onChange={(e) => {
                                           formik.setFieldValue("phone_whatsapp", "91" + e.target.value);
                                       }} />
                            <label htmlFor="phone_whatsapp">WhatsApp Phone Number</label>
                        </span>
                    </div>
                </Fieldset>
                <br/>
                <Fieldset legend={<span>Memberships<i className="pi pi-id-card pl-2"></i></span>} toggleable collapsed className="has-no-padding has-no-margin">
                    Temple: &nbsp;
                    <a href="https://iskconpunebcec.com/#/Home" target="_blank" rel="noopener noreferrer" className="underline">
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
                <br/>
                <Fieldset legend={<span>For official purposes<i className="pi pi-lock pl-2"></i></span>} toggleable collapsed className="has-no-padding has-no-margin">
                    <div className="grid sm:grid-cols-12 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            Counsellor ID: {formik.values.counsellor_id}
                        </div>
                        {
                        self && 
                        <div className="capitalize">
                            Source: {formik.values.source}
                        </div>
                        }
                    </div>
                </Fieldset>
            </ScrollPanel>
            <div className="grid grid-cols-2 mt-7">
                <div>
                    <small className="float-left"><strong>Note: Phone Number</strong> and <strong>Email</strong> can only be updated from User <i className="pi pi-cog"></i> Settings Page because they need verification.</small>
                </div>
                <div className="mr-3">
                    <Button label="Save" icon="pi pi-save" className="float-right p-button-danger" type="button" size="large" onClick={save}/>
                </div>
            </div>
            <Toast ref={toast} position="top-center"/>
        </form>
    );
}