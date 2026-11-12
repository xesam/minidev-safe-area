Page({
    back() {
        console.log('back');
    },
    home() {
        console.log('home');
    },
    onTapNew() {
        wx.navigateTo({
            url: '/pages/not-home/index'
        });
    }
});
