function xoaCanBang(phuongTrinh) {
    // Chia phương trình thành các thành phần bên trái và bên phải
    var parts = phuongTrinh.split('=');
    var benTrai = parts[0].trim();
    var benPhai = parts[1].trim();

    // Tách các chất trong phần bên trái và bên phải
    var chatBenTrai = benTrai.split('+');
    var chatBenPhai = benPhai.split('+');

    // Lấy danh sách các nguyên tố trong phương trình
    var nguyenTo = [];
    chatBenTrai.forEach(function (chat) {
        var elements = chat.match(/[A-Z][a-z]?\d*/g);
        nguyenTo = nguyenTo.concat(elements);
    });
    chatBenPhai.forEach(function (chat) {
        var elements = chat.match(/[A-Z][a-z]?\d*/g);
        nguyenTo = nguyenTo.concat(elements);
    });

    // Loại bỏ các nguyên tố trùng lặp
    nguyenTo = nguyenTo.filter(function (item, index, self) {
        return self.indexOf(item) === index;
    });

    // Tạo một đối tượng lưu trữ số lượng nguyên tố trong phương trình
    var soLuongNguyenTo = {};
    nguyenTo.forEach(function (element) {
        soLuongNguyenTo[element] = 0;
    });

    // Đếm số lượng nguyên tố trong phần bên trái
    chatBenTrai.forEach(function (chat) {
        var elements = chat.match(/[A-Z][a-z]?\d*/g);
        elements.forEach(function (element) {
            var match = element.match(/([A-Z][a-z]?)(\d*)/);
            var symbol = match[1];
            var coefficient = match[2] === '' ? 1 : parseInt(match[2]);
            soLuongNguyenTo[symbol] += coefficient;
        });
    });

    // Đếm số lượng nguyên tố trong phần bên phải
    chatBenPhai.forEach(function (chat) {
        var elements = chat.match(/[A-Z][a-z]?\d*/g);
        elements.forEach(function (element) {
            var match = element.match(/([A-Z][a-z]?)(\d*)/);
            var symbol = match[1];
            var coefficient = match[2] === '' ? 1 : parseInt(match[2]);
            soLuongNguyenTo[symbol] -= coefficient;
        });
    });

    // Xây dựng phương trình mới không cân bằng
    var phuongTrinhMoi = '';
    for (var symbol in soLuongNguyenTo) {
        if (soLuongNguyenTo[symbol] !== 0) {
            phuongTrinhMoi += symbol + (soLuongNguyenTo[symbol] > 1 ? soLuongNguyenTo[symbol] : '') + '+';
        }
    }

    // Loại bỏ dấu '+' cuối cùng
    phuongTrinhMoi = phuongTrinhMoi.slice(0, -1);

    // In kết quả
    console.log(phuongTrinhMoi);
}

// Sử dụng hàm xoaCanBang với phương trình cần xóa cân bằng
var phuongTrinh = 'H2 + O2 = H2O';
xoaCanBang(phuongTrinh);
