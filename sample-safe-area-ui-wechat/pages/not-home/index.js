Page({
    back() {
        console.log('back');
        wx.navigateBack({
            delta: 1
        });
    },
    home() {
        console.log('home');
        wx.redirectTo({
            url: '/pages/index/index'
        });
    }
});
