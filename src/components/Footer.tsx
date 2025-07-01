import Image from "next/image";
import packageInfo from '../../package.json';

export default function Footer() {
    return (
        <div id="App-footer" className="footer-dark has-padding">
            <footer>
                <div>
                    <div className="row text-center m-2">
                        <div className="col-md-9">
                            <div className="justify-center flex">
                                <Image src="/logo-light.png" alt="logo" width={128} height={128} priority/>
                            </div>
                            <div className="justify-center flex">
                                <Image src="/hero-text4-dark.png" alt="logo" width={200} height={128} priority/>
                            </div>
                            <br/>
                            <a className="footer-dark-special-text hover:underline hover:text-hover" href="https://vedabase.io/en/library/cc/adi/3/91/" target="_blank" rel="noopener noreferrer">
                                द्वौ भूत​-सर्गौ लोके ऽस्मिन् <br />
                                दैव आसुर एव च​  ।<br/>
                                <span className="p-tag p-tag-warning">विष्णु-भक्तः स्मृतो दैव</span><br />
                                आसुरस् तद्-विपर्ययः ।।<br/>
                                <span className="underline hover:text-hover text-sm">(Śrī Caitanya-Caritāmṛta Ādi 3.91)</span>
                            </a>
                            <br/><br/>
                            <h3>{packageInfo.displayName} v{packageInfo.version}</h3>
                            <p>{packageInfo.description}</p>
                        </div>
                    </div>
                    <br />
                    <hr/>
                    <br />
                    <div className="row">
                        <div className="col-sm-6 col-md-3 item">
                            <h3>Pune Temples&apos; Official Links</h3>
                            <ul>
                                <li>
                                    <a className="underline hover:text-hover" href="http://iskconvishalnagar.com" target="_blank" rel="noopener noreferrer">
                                        ISKCON (BCEC), formerly known as ISKCON Vishal Nagar
                                    </a>
                                </li>
                                <li>
                                    <a href="https://iskconpunebcec.com/#/newtemple" target="_blank" rel="noopener noreferrer">
                                    <p className="pi pi-star-fill text-amber-200"/>&nbsp;&nbsp;<span className="underline hover:text-hover">ISKCON (Baner) New Temple</span>&nbsp;&nbsp;<p className="pi pi-star-fill text-amber-200"/>
                                    </a>
                                </li>
                                <li>
                                    <a className="underline hover:text-hover" href="https://iskconpunecamp.com" target="_blank" rel="noopener noreferrer">
                                        ISKCON (Camp)
                                    </a>
                                </li>
                                <li>
                                    <a className="underline hover:text-hover" href="https://www.iskconpune.com" target="_blank" rel="noopener noreferrer">
                                        ISKCON (NVCC)
                                    </a>
                                </li>
                                <li>
                                    <a className="underline hover:text-hover" href="https://iskconravet.com" target="_blank" rel="noopener noreferrer">
                                        ISKCON (Ravet)
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <br />
                        <hr/><br/>
                        <div className="col-md-5 item text m-2">
                            <h3>ISKCON Bhakti Center for Education and Culture (BCEC)</h3>
                            <p>
                                Formerly known as ISKCON Vishal Nagar, ISKCON BCEC is ISKCON Camp (Pune)&apos;s Extension Center in
                                Vishal Nagar, Pimple Nilakh, Pune.
                                <br/>It was started with a motive to fulfil the need of locally situated
                                congregation, who could have an avenue for regular & daily nourishment in
                                their spiritual practices.
                                <br/>ISKCON BCEC is not an overnight establishment, but has taken
                                shape due to the consistent endeavour by the leadership of ISKCON Camp, Pune.
                            </p>
                            <br />
                            <div className="mapouter">
                                <div className="gmap_canvas">
                                    <iframe className="gmap_iframe" width="100%" title="map-iskcon-bcec"
                                            src="https://maps.google.com/maps?width=600&amp;height=400&amp;hl=en&amp;q=ISKCON Vishal Nagar&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed">
                                    </iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                    <span className="footer-dark-special-text">
                        ईश्वर: परम: कृष्ण: सच्चिदानंद विग्रह: ।<br/>
                        अनादिरादिर्गोविंद: सर्वकारणकारणम् ।।
                    </span>
                    <Image
                        src="/signature-prabhupada.png"
                        alt="Devotees' Association"
                        width={400}
                        height={214}
                        className="invert-70 m-auto mt-6"
                    />
                    <p className="copyright left">All glories to Shri Guru and Gauranga</p>
                    <p className="copyright left">Developed with प्रेम❤️🙏भक्ति by {packageInfo.author}</p>
                    <p className="copyright right">
                        Copyright © 2025 &nbsp;
                        <a className="underline hover:text-hover" href="https://harekrishna.app" target="_blank" rel="noopener noreferrer">
                            HareKrishna.app
                        </a>
                        &nbsp;- All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}