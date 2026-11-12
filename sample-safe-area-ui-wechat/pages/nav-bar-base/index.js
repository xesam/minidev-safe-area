Page({
    onTapLeft() {
        console.log('left');
        wx.navigateBack({ delta: 1 });
    },
    onTapRight() {
        console.log('right');
    }
});
