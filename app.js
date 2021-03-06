/**
 * www.52pojie.cn  
 * by：Burial0
 */
const {
  login,
  getAppVersion,
  getStuFaceTeachList,
  getStuFaceActivityList,
  isJoinActivities,
  saveStuSign
} = require('./api')

const dateTime = require('silly-datetime')

let appVersion,
  newToken,
  token,
  stuId,
  faceDate,
  count = 0,
  toDayDataList,
  classroomList,
  activityIdList = [];

async function main () {
  if (userName.length <= 0 || userPwd.length <= 0) return console.log('账号或密码未填写！');
  const res1 = await getAppVersion()
  appVersion = res1.data.appVersionInfo.VersionCode
  const res2 = await login({
    appVersion,
    clientId: 'e9cf62b22f084849ad075e38a93b33fa',
    equipmentApiVersion: '15.0',
    equipmentAppVersion: appVersion,
    equipmentModel: 'iPhone 13 pro',
    sourceType: '3',
    userName,
    userPwd
  })
  token = res2.token
  newToken = res2.newToken
  stuId = res2.userId
  faceDate = dateTime.format(new Date, 'YYYY-MM-DD')
  const res3 = await getStuFaceTeachList({
    stuId,
    newToken,
    faceDate
  })
  try {
    toDayDataList = res3.dataList
    if (!toDayDataList.length) return console.log('今天没课，时间自由安排！');
    console.log(`检索到今日有${toDayDataList.length}门课`);
    for (const item of toDayDataList) {
      const res4 = await getStuFaceActivityList({
        activityId: item.Id,
        stuId,
        classState: item.state,
        openClassId: item.openClassId,
        newToken
      })
      if (!res4.dataList) return console.log(item.courseName + '-----' + res4.msg);
      classroomList = res4.dataList
      console.log(`${item.Title + '-----' + item.courseName + '-----' + item.classSection}节次`);
      //console.log(`课堂中有${toDayDataList.length}个活动`)
      for (const jtem of classroomList) {
        if (jtem.DataType == '签到' && jtem.State != 3) {
          const res5 = await isJoinActivities({
            activityId: item.Id,
            openClassId: item.openClassId,
            stuId,
            typeId: jtem.Id,
            type: 2,
            newToken,
          })
          if (res5.isAttend != 1 && activityIdList.indexOf(item.Id) <= -1) {
            const res6 = await saveStuSign({
              signId: jtem.Id,
              stuId,
              openClassId: item.openClassId,
              sourceType: 3,
              checkInCode: jtem.Gesture || '',
              activityId: item.Id,
              newToken,
              equipmentAppVersion: appVersion
            })
            if (res6.code == 1) {
              activityIdList.push(item.Id)
            }
            console.log(item.courseName + '-----' + res6.msg);
          } else {
            console.log(`${item.courseName + '-----' + item.Title}课堂中的${toDayDataList.length}已经签到 跳过执行！`);
          }
        }
      }
    }
  } catch (error) {
    console.log('执行失败！重新发起请求中...');
    setTimeout(main, 60000) //一分钟运行一次
  }
  count++
  console.log(`--------------------系统已经检索${count}次--------------------`);
   console.log(dateTime.format(new Date, '------------此次请求时间:YYYY-MM-DD HH:mm:ss-----------'))
}

const userName = '2146236240',
  userPwd = 'Yinzehao521'
setInterval(main, 60000); //一分钟运行一次