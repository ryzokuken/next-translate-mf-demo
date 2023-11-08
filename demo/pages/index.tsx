import Trans from "next-translate/Trans"

export default function Home() {
    return (
        <Trans
            i18nKey="justdemo"
            components={{
                link: <a href="/" />,
                b: <b style={{ color: "red" }} />,
                icon: <img src="https://imgs.xkcd.com/comics/purity.png"/>,
            }}
            // This is without pluralizing the count value
            values={{ count: 42 }}
            defaultTrans="Click <link>here</link>. {{count}} or <b>{{count}}</b>. <icon/> is an icon."
        />
    )
}
