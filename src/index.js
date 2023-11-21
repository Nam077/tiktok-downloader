const fs = require("fs");
const axios = require("axios");
const { log } = require("console");

const callApi = async (id) => {
    const response = await axios.post("https://drive.base.vn/thanhphong1110-drive/folder/" + id, {
        // Dữ liệu body ở đây
        from: "",
        __s: "thanhphong1110-drive",
        _rt: "e3d9ad179c3eb9d1f47eaff7d3d98ac7",
        direct_load: true,
        __code: "c1061ccf2e8f06215afa4a9e4b283857",
        __sessionid: "78q6h9cvdhmc4eh85dc66sthhsqf7hfsj6ihj4h5kv93hk7g78sdl8d9subcks1b8pf7qpnrm8fefk7af06rh3dolkgh879hak2bp28e979nhp76gc8kqsf51mt3lja8",
        __otp: "c396612c7ad914670ceb609b7cc9839d",
    }, {
        headers: {
            "accept": "*/*",
            "accept-language": "vi,en-US;q=0.9,en;q=0.8",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"YaBrowser\";v=\"23\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",

        },
        responeEncoding: "utf-8",
        // Thêm các tùy chọn khác ở đây (nếu cần)
    })
    if (response.data) {
        const jsonData = response.data._page_data;
        const regexPattern = /Client\.pageData=(\{.*\});/;

        const match = jsonData.match(regexPattern);

        if (match) {
            const clientPageDataStr = match[1];

            const clientPageData = JSON.parse(clientPageDataStr);

            fs.writeFileSync("../data/" + id + ".json", JSON.stringify(clientPageData));
            return clientPageData
        } else {
            return null
        }
    }
}

(async () => {
    const data = await callApi("11000");
    if (!data.folders) {
    }
    let folders = data.folders;
    console.log(folders)
    let task = []

    for (const item of folders) {
        log(item.id)
        task.push(callApi(item.id));
    }
    const result = await Promise.all(task);

})();