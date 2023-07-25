import { useState } from "react"
import { AsidePageRoutes } from "../../routes/asidePageRoutes"
import { useNavigate } from 'react-router-dom';

export function AsidePage({ asideStyle, setAsideStyle, setHomeStyle }) {
    const [pageName, setPageName] = useState(null)
    const navigate = useNavigate();

    return (
        <div className="page aside-page" style={asideStyle}>
            <nav>
                <button onClick={() => { navigate(-1) }}>
                    <span className="icon">--</span>
                    <span className="page-name">{pageName}</span>
                </button>
            </nav>

            <AsidePageRoutes setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
        </div>
    )
}