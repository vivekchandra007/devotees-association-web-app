import Image from "next/image";
import packageInfo from '../../package.json';
function Footer() {
    return (
        <div id="App-footer" className="footer-dark has-padding">
            <footer>
                <div>
                    <div className="row text-center m-2">
                        <div className="col-md-3 has-padding justify-center flex">
                            <Image className="App-logo duration-30000" src="/logo-dark.png" alt="logo" width={128} height={128} priority/>
                        </div>
                        <div className="col-md-9">
                            <span className="footer-dark-special-text">
                                ईश्वर: परम: कृष्ण: सच्चिदानंद विग्रह: ।<br/>
                                अनादिरादिर्गोविंद: सर्वकारणकारणम् ।।
                            </span>
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
                                    <a className="underline" href="http://iskconvishalnagar.com" target="_blank" rel="noopener noreferrer">
                                        ISKCON (BCEC), formerly known as ISKCON Vishal Nagar
                                    </a>
                                </li>
                                <li>
                                    <a className="underline" href="https://iskconpunebcec.com/#/newtemple" target="_blank" rel="noopener noreferrer">
                                    <p className="pi pi-star text-amber-300"/>&nbsp;&nbsp;ISKCON (Baner) New Temple&nbsp;&nbsp;<p className="pi pi-star text-amber-300"/>
                                    </a>
                                </li>
                                <li>
                                    <a className="underline" href="https://iskconpunecamp.com" target="_blank" rel="noopener noreferrer">
                                        ISKCON (Camp)
                                    </a>
                                </li>
                                <li>
                                    <a className="underline" href="https://www.iskconpune.com" target="_blank" rel="noopener noreferrer">
                                        ISKCON (NVCC)
                                    </a>
                                </li>
                                <li>
                                    <a className="underline" href="https://iskconravet.com" target="_blank" rel="noopener noreferrer">
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
                                Formerly known as ISKCON Vishal Nagar Pune is ISKCON Camp&apos;s Extension Center in
                                Vishal Nagar, Pimple Nilakh, Pune.
                                <br/>It was started with a motive to fulfil the need of locally situated
                                congregation, who could have an avenue for regular & daily nourishment in
                                their spiritual practices.
                                <br/>ISKCON Vishal Nagar is not an overnight establishment, but has taken
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
                    <p className="copyright left">Developed with प्रेम❤️🙏भक्ति by {packageInfo.author}</p>
                    <p className="copyright right">Copyright © 2025 Shri-Krishna - All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
}
export default Footer;