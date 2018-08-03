const chai = require('chai');
const chaiHttp = require('chai-http');

const expect = chai.expect;
chai.use(chaiHttp);

// module.exports = {
// server,
// stopServer,
// };
// index.js의 맨 아래부분에 있는 export형식을 보면, 앱과 서버를 멈추는 함수를 가져왓음을 알 수 있다
const { server, stopServer } = require('../index.js');

describe('도커 컨트롤러 테스트', async () => {
  beforeEach(() => {
    this.request = chai.request(server);

    // 테스트 내부에서 this.request를 사용할 수 있게해줌
  });

  afterEach(() => {
    stopServer();
  }); // 서버를 꺼주지 않으면 에러 발생

  // 테스트 #1: 모카 작동하는지 확인하기
  it('기본적인 모카 테스트가 작동한다', (done) => {
    const num = 1;
    expect(num).to.equal(1);
    done();
  });
  // 테스트 #2: API 요청으로 컨테이너 리스트를 가져올 수 있는지 확인하기
  it('/docker/api/v1/listContainers/', (done) => {
    chai.request(server) // 우선 서버로 요청을 보낸다
      .get('/docker/api/v1/listContainers') // 테스트하고 싶은 API URL을 GET한다
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.status(200);
        expect(res.body).to.be.an('array'); // 리턴된 값이 어레이인지 확인
        setTimeout(done, 4000);
      });
  }).timeout(15000);

  // 테스트 #3: API 요청을 통해 도커 이미지를 pull 한다.
  it('/docker/api/v1/img-pull/', (done) => {
    chai.request(server)
      .post('/docker/api/v1/img-build/')
      .send({ image: 'ubuntu' })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
      });
  });

  // 테스트 #4 : API를 통해 image를 build 한다.
  it('/docker/api/v1/img-build/', (done) => {
    chai.request(server)
      .post('/docker/api/v1/img-build/')
      .send({ path: './ubuntu.tar', tag: 'test' })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        setTimeout(done, 16000);
      });
  }).timeout(32000);
});
