import { HTMLElementProps, TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { makeTagElementProps } from "../userInerface";

function makeImageProps(htmlImageElement: HTMLImageElement) {

    const imgProps = makeTagElementProps({
        tag: "img",
        namespace: "html",
        attributes: {
            src: (htmlImageElement as HTMLImageElement).src,
            alt: "image",
            style: `width:100%;`,

        },
    });
    const style = `float: "right";justifyContent: "center";max-width: "50%";z-index: 3`;
    const props = {
        tag: "div",
        namespace: "html",
        id: "popupImage",
        attributes: {
            style: style,
        },
        children: [imgProps],
    } as TagElementProps;
    return props;
}

export const imageUtilties = {
    makeImageProps,
};